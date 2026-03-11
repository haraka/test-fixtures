// A subclass of Socket which reads data by line

const Events = require('events')

const stub = require('./stub')

const LINE_REGEXP = /^([^\n]*\n)/

class Socket extends Events {
  constructor(port, host) {
    super()

    this.port = port
    this.host = host
    this.setTimeout = stub()
    this.setKeepAlive = stub()
    this.destroy = stub()
    this.writable = true
    this.readable = true

    // Setup line processor
    setupLineProcessor(this)
  }

  write(data, encoding, callback) {
    this.emit('data', data)
    if (callback) callback()
    return true
  }

  end(data, encoding, callback) {
    if (data) {
      this.write(data, encoding)
    }
    this.writable = false
    this.emit('end')
    if (callback) callback()
  }
}

function setupLineProcessor(socket) {
  let currentData = ''

  socket.on('data', function onSocketData(data) {
    currentData += data
    let results
    while ((results = LINE_REGEXP.exec(currentData))) {
      const thisLine = results[1]
      currentData = currentData.slice(thisLine.length)
      socket.emit('line', thisLine)
    }
  })

  socket.on('end', function onSocketEnd() {
    if (currentData.length) {
      socket.emit('line', currentData)
    }
    currentData = ''
  })
}

exports.Socket = Socket

exports.connect = function (port, host, cb) {
  const sock = new Socket(port, host)
  if (cb) {
    sock.on('connect', cb)
  }
  return sock
}
