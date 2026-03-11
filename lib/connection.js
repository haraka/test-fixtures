const config = require('haraka-config')
const constants = require('haraka-constants')
const ipaddr = require('ipaddr.js')
const Notes = require('haraka-notes')
const ResultStore = require('haraka-results')
const utils = require('haraka-utils')

const logger = require('./logger')
const transaction = require('./transaction')

const states = constants.connection.state

class Connection {
  constructor(client, server, cfg) {
    this.client = client
    this.server = server
    this.cfg = cfg

    this.local = {
      ip: null,
      port: null,
      host: 'haraka-test.example.com',
      info: 'Haraka',
    }
    this.remote = {
      ip: '127.0.0.1',
      port: null,
      host: null,
      info: null,
      closed: false,
      is_private: false,
      is_local: false,
    }
    this.hello = {
      host: null,
      verb: null,
    }
    this.tls = {
      enabled: false,
      advertised: false,
      verified: false,
      cipher: {},
    }
    this.proxy = {
      allowed: false,
      ip: null,
      type: null,
      timer: null,
    }
    this.set('tls', 'enabled', !!server.has_tls)

    this.current_data = null
    this.current_line = null
    this.state = states.PAUSE
    this.encoding = 'utf8'
    this.prev_state = null
    this.loop_code = null
    this.loop_msg = null
    this.uuid = utils.uuid()
    this.notes = new Notes()
    this.notes.tls = {}
    this.transaction = null
    this.tran_count = 0
    this.capabilities = null
    this.ehlo_hello_message = 'Haraka Test is at your service.'
    this.connection_close_message = 'closing test connection.'
    this.banner_includes_uuid = true
    this.deny_includes_uuid = true
    this.early_talker = false
    this.pipelining = false
    this._relaying = false
    this.esmtp = false
    this.last_response = null
    this.hooks_to_run = []
    this.start_time = Date.now()
    this.last_reject = ''
    this.max_bytes = 0
    this.max_mime_parts = 1000
    this.totalbytes = 0
    this.rcpt_count = {
      accept: 0,
      tempfail: 0,
      reject: 0,
    }
    this.msg_count = {
      accept: 0,
      tempfail: 0,
      reject: 0,
    }
    this.max_line_length = 512
    this.max_data_line_length = 992
    this.results = new ResultStore(this)
    this.errors = 0
    this.last_rcpt_msg = null
    this.hook = null
    if (this.cfg.headers.show_version) {
      this.local.info += `/${utils.getVersion(__dirname)}`
    }

    logger.add_log_methods(this, 'mock-connection')
    Connection.setupClient(this)
  }

  static setupClient(self) {
    if (Object.keys(self.client).length === 0) return
    const ip = self.client.remoteAddress
    if (!ip) {
      self.logdebug('setupClient got no IP address for this connection!')
      self.client.destroy()
      return
    }

    const local_addr = self.server.address()
    self.set(
      'local',
      'ip',
      ipaddr.process(self.client.localAddress || local_addr.address).toString(),
    )
    self.set('local', 'port', self.client.localPort || local_addr.port)
    self.results.add({ name: 'local' }, self.local)

    self.set('remote', 'ip', ipaddr.process(ip).toString())
    self.set('remote', 'port', self.client.remotePort)
    self.results.add({ name: 'remote' }, self.remote)

    self.lognotice('connect', {
      ip: self.remote.ip,
      port: self.remote.port,
      local_ip: self.local.ip,
      local_port: self.local.port,
    })

    if (!self.client.on) return

    const log_data = { ip: self.remote.ip }
    if (self.remote.host) log_data.host = self.remote.host

    self.client.on('end', () => {
      if (self.state >= states.DISCONNECTING) return
      self.remote.closed = true
      self.loginfo('client half closed connection', log_data)
      self.fail()
    })

    self.client.on('close', (has_error) => {
      if (self.state >= states.DISCONNECTING) return
      self.remote.closed = true
      self.loginfo('client dropped connection', log_data)
      self.fail()
    })

    self.client.on('error', (err) => {
      if (self.state >= states.DISCONNECTING) return
      self.loginfo(`client connection error: ${err}`, log_data)
      self.fail()
    })

    self.client.on('timeout', () => {
      // FIN has sent, when timeout just destroy socket
      if (self.state >= states.DISCONNECTED) {
        self.client.destroy()
        self.loginfo(`timeout, destroy socket (state:${self.state})`)
        return
      }
      if (self.state >= states.DISCONNECTING) return
      self.respond(421, 'timeout', () => {
        self.fail('client connection timed out', log_data)
      })
    })

    self.client.on('data', (data) => {
      self.process_data(data)
    })

    // plugins.run_hooks('connect_init', self)
  }

  setTLS(obj) {
    this.set('hello', 'host', undefined)
    this.set('tls', 'enabled', true)
    for (const t of ['cipher', 'verified', 'verifyError', 'peerCertificate']) {
      if (obj[t] === undefined) return
      this.set('tls', t, obj[t])
    }
  }

  set(prop_str, val) {
    if (arguments.length === 3) {
      prop_str = `${arguments[0]}.${arguments[1]}`
      val = arguments[2]
    }

    const path_parts = prop_str.split('.')
    let loc = this
    for (let i = 0; i < path_parts.length; i++) {
      const part = path_parts[i]
      if (part === '__proto__' || part === 'constructor') continue

      // while another part remains
      if (i < path_parts.length - 1) {
        if (loc[part] === undefined) loc[part] = {} // initialize
        loc = loc[part] // descend
        continue
      }

      // last part, so assign the value
      loc[part] = val
    }
  }

  get(prop_str) {
    return prop_str.split('.').reduce((prev, curr) => {
      return prev ? prev[curr] : undefined
    }, this)
  }

  set relaying(val) {
    if (this.transaction) {
      this.transaction._relaying = val
    } else {
      this._relaying = val
    }
  }

  get relaying() {
    if (this.transaction && '_relaying' in this.transaction)
      return this.transaction._relaying
    return this._relaying
  }

  auth_results(message) {}

  respond(code, msg, func) {
    return func()
  }

  init_transaction(done) {
    this.transaction = new transaction.createTransaction(null, this.cfg)
    this.transaction.results = new ResultStore(this)
    if (done) done()
  }

  reset_transaction(done) {
    if (this.transaction && this.transaction.resetting === false) {
      this.transaction.resetting = true
    } else {
      this.transaction = null
    }
    if (done) done()
  }

  // SMTP State Machine Methods
  pause() {
    if (this.state >= states.DISCONNECTING) return
    if (this.client && this.client.pause) this.client.pause()
    if (this.state !== states.PAUSE_DATA) this.prev_state = this.state
    this.state = states.PAUSE_DATA
  }

  resume() {
    if (this.state >= states.DISCONNECTING) return
    if (this.client && this.client.resume) this.client.resume()
    if (this.prev_state && this.state === states.PAUSE_DATA) {
      this.state = this.prev_state
    }
    this.prev_state = null
    setImmediate(() => this._process_data())
  }

  process_data(data) {
    if (!this.current_data || !this.current_data.length) {
      this.current_data = data
    } else {
      // Data left over in buffer
      const buf = Buffer.concat(
        [this.current_data, data],
        this.current_data.length + data.length,
      )
      this.current_data = buf
    }
    this._process_data()
  }

  _process_data() {
    // Prevent processing if disconnecting or paused
    if (this.state >= states.DISCONNECTING) return
    if (this.state === states.PAUSE_DATA) return

    // Simple line processor: split on \n and emit 'line' events
    if (!this.current_data) return

    const lines = this.current_data.toString().split('\n')
    if (lines[lines.length - 1] !== '') {
      // Last element is incomplete line, keep in buffer
      this.current_data = Buffer.from(lines.pop() || '')
    } else {
      // All complete lines, clear buffer
      this.current_data = null
    }

    for (const line of lines) {
      if (line !== '') {
        this.process_line(`${line}\n`)
      }
    }
  }

  process_line(line) {
    if (this.state >= states.DISCONNECTING) return
    this.current_line = line
    // Stub: plugins/tests can override this or listen to 'line' events
  }

  disconnect() {
    if (this.state >= states.DISCONNECTING) return
    this.state = states.DISCONNECTING
    if (this.transaction) {
      this.transaction = null
    }
    if (this.client && this.client.destroy) {
      this.client.destroy()
    }
    this.loginfo('disconnect')
  }

  get_capabilities() {
    const capabilities = [
      'PIPELINING',
      '8BITMIME',
      `SIZE ${this.cfg?.main?.max_bytes || 0}`,
    ]
    if (this.cfg?.main?.smtputf8) {
      capabilities.push('SMTPUTF8')
    }
    return capabilities
  }

  // Hook Responder Methods
  mail_respond(retval, msg) {
    if (!this.transaction) {
      this.logerror('mail_respond found no transaction!')
      return
    }
    const sender = this.transaction.mail_from
    const dmsg = `sender ${sender.format()}`

    const store_results = (action) => {
      let addr = sender.format()
      if (addr.length > 2) {
        addr = addr.slice(1, -1) // trim off < >
      }
      if (this.transaction.results) {
        this.transaction.results.add(
          { name: 'mail_from' },
          {
            action,
            address: addr,
          },
        )
      }
    }

    switch (retval) {
      case 'deny':
        this.respond(550, msg || `${dmsg} denied`, () => {
          store_results('reject')
          this.reset_transaction()
        })
        break
      case 'denydisconnect':
        this.respond(550, msg || `${dmsg} denied`, () => {
          store_results('reject')
          this.disconnect()
        })
        break
      case 'denysoft':
        this.respond(450, msg || `${dmsg} denied`, () => {
          store_results('tempfail')
          this.reset_transaction()
        })
        break
      case 'denysoftdisconnect':
        this.respond(450, msg || `${dmsg} denied`, () => {
          store_results('tempfail')
          this.disconnect()
        })
        break
      default:
        store_results('accept')
        this.respond(250, msg || `${dmsg} OK`)
    }
  }

  rcpt_incr(rcpt, action, msg, retval) {
    this.transaction.rcpt_count[action]++
    this.rcpt_count[action]++

    const addr = rcpt.format()
    const recipient = {
      address: addr.slice(1, -1),
      action,
    }

    if (msg && action !== 'accept') {
      recipient.msg = msg
    }

    if (this.transaction.results) {
      this.transaction.results.push({ name: 'rcpt_to' }, { recipient })
    }
  }

  rcpt_ok_respond(retval, msg) {
    if (!this.transaction) {
      this.logerror('rcpt_ok_respond found no transaction')
      return
    }
    if (!msg) msg = this.last_rcpt_msg
    const rcpt = this.transaction.rcpt_to[this.transaction.rcpt_to.length - 1]
    const dmsg = `recipient ${rcpt.format()}`

    switch (retval) {
      case 'deny':
        this.respond(550, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'reject', msg, retval)
          this.transaction.rcpt_to.pop()
        })
        break
      case 'denydisconnect':
        this.respond(550, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'reject', msg, retval)
          this.disconnect()
        })
        break
      case 'denysoft':
        this.respond(450, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'tempfail', msg, retval)
          this.transaction.rcpt_to.pop()
        })
        break
      case 'denysoftdisconnect':
        this.respond(450, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'tempfail', msg, retval)
          this.disconnect()
        })
        break
      default:
        this.respond(250, msg || `${dmsg} OK`, () => {
          this.rcpt_incr(rcpt, 'accept', msg, retval)
        })
    }
  }

  rcpt_respond(retval, msg) {
    if (!this.transaction) {
      this.logerror('rcpt_respond found no transaction')
      return
    }
    const rcpt = this.transaction.rcpt_to[this.transaction.rcpt_to.length - 1]
    const dmsg = `recipient ${rcpt.format()}`

    switch (retval) {
      case 'deny':
        this.respond(550, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'reject', msg, retval)
          this.transaction.rcpt_to.pop()
        })
        break
      case 'denydisconnect':
        this.respond(550, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'reject', msg, retval)
          this.disconnect()
        })
        break
      case 'denysoft':
        this.respond(450, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'tempfail', msg, retval)
          this.transaction.rcpt_to.pop()
        })
        break
      case 'denysoftdisconnect':
        this.respond(450, msg || `${dmsg} denied`, () => {
          this.rcpt_incr(rcpt, 'tempfail', msg, retval)
          this.disconnect()
        })
        break
      case 'ok':
        this.last_rcpt_msg = msg
        break
      default:
        const rej_msg = `I cannot deliver mail for ${rcpt.format()}`
        this.respond(550, rej_msg, () => {
          this.rcpt_incr(rcpt, 'reject', rej_msg, retval)
          this.transaction.rcpt_to.pop()
        })
    }
  }

  data_respond(retval, msg) {
    let cont = 0
    switch (retval) {
      case 'deny':
        this.respond(554, msg || 'Message denied', () => {
          this.reset_transaction()
        })
        break
      case 'denydisconnect':
        this.respond(554, msg || 'Message denied', () => {
          this.disconnect()
        })
        break
      case 'denysoft':
        this.respond(451, msg || 'Message denied', () => {
          this.reset_transaction()
        })
        break
      case 'denysoftdisconnect':
        this.respond(451, msg || 'Message denied', () => {
          this.disconnect()
        })
        break
      default:
        cont = 1
    }
    if (!cont) return

    // Accept the message for data
    this.respond(354, 'go ahead, make my day', () => {
      this.state = states.DATA
      if (this.transaction) {
        this.transaction.data_bytes = 0
      }
    })
  }
}

exports.Connection = Connection

exports.createConnection = function (client = {}, server = {}, cfg = {}) {
  if (!cfg || Object.keys(cfg).length === 0) {
    cfg = config.get('smtp.ini', {
      booleans: [
        '+main.smtputf8',
        '+headers.add_received',
        '+headers.clean_auth_results',
      ],
    })
  }
  return new Connection(client, server, cfg)
}
