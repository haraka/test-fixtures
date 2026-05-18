'use strict'

// A tiny, zero-dependency DNS server for tests.
//
// It speaks just enough of the DNS wire protocol (RFC 1035) over UDP to
// answer A / AAAA / MX / TXT queries and to return real failure RCODEs,
// so plugin tests exercise the real node:dns -> haraka-net-utils -> plugin
// path with real Error objects instead of mocking the resolver.
//
//   const dns = await fixtures.dns.start({
//     'good.example':   { a: ['1.2.3.4'], mx: [{ preference: 10, exchange: 'mx.good.example' }] },
//     'broken.example': { rcode: 'SERVFAIL' },
//     'slow.example':   { a: ['1.2.3.4'], delayMs: 50 },
//     'gone.example':   { drop: true },
//   })
//   const resolver = dns.resolver({ timeout: 500 })   // node:dns Resolver -> test
//   await resolver.resolveMx('good.example')
//   await dns.close()

const dgram = require('node:dgram')
const { Resolver } = require('node:dns').promises
const ipaddr = require('ipaddr.js')

// QTYPE / RR TYPE codes
const TYPE = { A: 1, MX: 15, TXT: 16, AAAA: 28 }

// RCODEs (RFC 1035 §4.1.1 + RFC 6895)
const RCODE = { NOERROR: 0, FORMERR: 1, SERVFAIL: 2, NXDOMAIN: 3, NOTIMP: 4, REFUSED: 5 }

function normalizeName(name) {
  return String(name).toLowerCase().replace(/\.$/, '')
}

// Decode the (single, uncompressed) question. Queries never use name
// compression, so a plain label loop is sufficient.
function parseQuestion(msg) {
  const labels = []
  let off = 12
  for (;;) {
    const len = msg[off]
    if (len === undefined) throw new Error('truncated question')
    if (len === 0) {
      off += 1
      break
    }
    if (len & 0xc0) throw new Error('unexpected compression in question')
    labels.push(msg.toString('ascii', off + 1, off + 1 + len))
    off += 1 + len
  }
  const qtype = msg.readUInt16BE(off)
  const qclass = msg.readUInt16BE(off + 2)
  return { name: labels.join('.').toLowerCase(), qtype, qclass, qEnd: off + 4 }
}

// Encode a domain name as a sequence of length-prefixed labels (no
// compression). Resolvers accept uncompressed names inside RDATA.
function encodeName(name) {
  const bufs = []
  for (const label of normalizeName(name).split('.')) {
    const b = Buffer.from(label, 'ascii')
    if (b.length > 63) throw new Error(`label too long: ${label}`)
    bufs.push(Buffer.from([b.length]), b)
  }
  bufs.push(Buffer.from([0]))
  return Buffer.concat(bufs)
}

function ipBytes(addr) {
  return Buffer.from(ipaddr.parse(addr).toByteArray())
}

function mxRdata({ preference = 10, exchange }) {
  const pref = Buffer.alloc(2)
  pref.writeUInt16BE(preference, 0)
  return Buffer.concat([pref, encodeName(exchange)])
}

function txtRdata(txt) {
  const strings = Array.isArray(txt) ? txt : [txt]
  const bufs = []
  for (const s of strings) {
    const b = Buffer.from(String(s), 'utf8')
    if (b.length > 255) throw new Error('TXT string > 255 bytes')
    bufs.push(Buffer.from([b.length]), b)
  }
  return Buffer.concat(bufs)
}

// Resolve a zone definition + query type into { rcode, answers }.
function answerFor(zone, qtype) {
  if (!zone) return { rcode: RCODE.NXDOMAIN, answers: [] }
  if (zone.rcode) {
    const rc = RCODE[String(zone.rcode).toUpperCase()]
    if (rc === undefined) throw new Error(`unknown rcode: ${zone.rcode}`)
    return { rcode: rc, answers: [] }
  }

  const answers = []
  if (qtype === TYPE.A && zone.a) for (const ip of zone.a) answers.push({ type: TYPE.A, rdata: ipBytes(ip) })
  if (qtype === TYPE.AAAA && zone.aaaa)
    for (const ip of zone.aaaa) answers.push({ type: TYPE.AAAA, rdata: ipBytes(ip) })
  if (qtype === TYPE.MX && zone.mx) for (const mx of zone.mx) answers.push({ type: TYPE.MX, rdata: mxRdata(mx) })
  if (qtype === TYPE.TXT && zone.txt) answers.push({ type: TYPE.TXT, rdata: txtRdata(zone.txt) })

  // Name exists but has no record of this type: NOERROR / 0 answers,
  // which the resolver surfaces as ENODATA.
  return { rcode: RCODE.NOERROR, answers }
}

// One answer RR. NAME is a compression pointer to the question name at
// offset 12 (0xC00C), which every resolver understands.
function encodeRR({ type, ttl = 300, rdata }) {
  const head = Buffer.alloc(12)
  head.writeUInt16BE(0xc00c, 0) // NAME -> pointer to question
  head.writeUInt16BE(type, 2) // TYPE
  head.writeUInt16BE(1, 4) // CLASS IN
  head.writeUInt32BE(ttl, 6) // TTL
  head.writeUInt16BE(rdata.length, 10) // RDLENGTH
  return Buffer.concat([head, rdata])
}

function buildResponse(query, qEnd, rcode, answers) {
  const header = Buffer.alloc(12)
  header.writeUInt16BE(query.readUInt16BE(0), 0) // copy ID
  const rd = (query.readUInt16BE(2) >> 8) & 0x01 // copy RD bit
  // QR=1, Opcode=0, AA=1, TC=0, RD, RA=1, Z=0, RCODE
  const flags = 0x8000 | (1 << 10) | (rd << 8) | (1 << 7) | (rcode & 0x0f)
  header.writeUInt16BE(flags, 2)
  header.writeUInt16BE(query.readUInt16BE(4), 4) // QDCOUNT (echo)
  header.writeUInt16BE(answers.length, 6) // ANCOUNT
  // NSCOUNT / ARCOUNT remain 0
  const question = query.subarray(12, qEnd)
  return Buffer.concat([header, question, ...answers.map(encodeRR)])
}

// Point an existing thing at this test server.
//  - a node:dns promises Resolver  -> setServers()
//  - haraka-net-utils' dns_config  -> patch its cached singleton
// Returns a restore() function. Kept dependency-free: the caller passes
// the object (e.g. require('haraka-net-utils/lib/dns_config')).
function patch(target, port) {
  const servers = [`127.0.0.1:${port}`]
  if (target && typeof target.getDnsResolver === 'function') {
    const r = target.getDnsResolver()
    const prev = r.getServers()
    r.setServers(servers)
    return () => r.setServers(prev)
  }
  if (target && typeof target.setServers === 'function') {
    const prev = target.getServers()
    target.setServers(servers)
    return () => target.setServers(prev)
  }
  throw new Error('patch(): expected a node:dns Resolver or a dns_config module')
}

exports.start = function (zones = {}, opts = {}) {
  return new Promise((resolve, reject) => {
    const map = new Map()
    const setZone = (name, cfg) => map.set(normalizeName(name), cfg)
    for (const [name, cfg] of Object.entries(zones)) setZone(name, cfg)

    const sock = dgram.createSocket('udp4')

    sock.on('message', (msg, rinfo) => {
      let q
      try {
        q = parseQuestion(msg)
      } catch {
        return // malformed packet: stay silent
      }
      const zone = map.get(q.name)
      if (zone && zone.drop) return // simulate a black hole (-> ETIMEOUT)

      const send = () => {
        let resp
        try {
          const { rcode, answers } = answerFor(zone, q.qtype)
          resp = buildResponse(msg, q.qEnd, rcode, answers)
        } catch {
          resp = buildResponse(msg, q.qEnd, RCODE.SERVFAIL, [])
        }
        sock.send(resp, rinfo.port, rinfo.address)
      }

      if (zone && zone.delayMs) setTimeout(send, zone.delayMs)
      else send()
    })

    sock.once('error', reject)
    sock.bind(opts.port || 0, '127.0.0.1', () => {
      const { port, address } = sock.address()
      resolve({
        port,
        address,
        setZone,
        clearZones: () => map.clear(),
        close: () => new Promise((r) => sock.close(r)),
        // A fresh node:dns Resolver already pointed at this server.
        resolver: ({ timeout = 500, tries = 1 } = {}) => {
          const r = new Resolver({ timeout, tries })
          r.setServers([`127.0.0.1:${port}`])
          return r
        },
        // Point an existing Resolver / dns_config at this server.
        patch: (target) => patch(target, port),
      })
    })
  })
}

exports.TYPE = TYPE
exports.RCODE = RCODE
