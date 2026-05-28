exports.register = function () {
  this.register_hook('rcpt', 'hook_rcpt_echo')
  this.register_hook('connect', 'connect_echo')
  this.register_hook('helo', 'helo_echo')
  this.register_hook('mail', 'mail_echo')
  this.register_hook('data_post', 'data_post_async')
  this.register_hook('queue', 'queue_returns_array')
}

// 3.x callback-style: echoes params back via next(rc, msg).
exports.hook_rcpt_echo = function (next, connection, params) {
  const [rc, msg] = params ?? []
  next(rc, msg)
}

exports.connect_echo = function (next, connection) {
  connection.notes.last_connect = true
  next()
}

exports.helo_echo = function (next, connection, host) {
  connection.notes.last_helo = host
  next()
}

exports.mail_echo = function (next, connection, params) {
  const [addr] = params
  connection.notes.last_mail_from = addr?.address
  next()
}

// 4.0-style async returning an object.
exports.data_post_async = async function (connection) {
  connection.notes.last_data_post = true
  return { rc: 902 /* DENY */, msg: 'no thanks' }
}

// 4.0-style async returning an [rc, msg] tuple.
exports.queue_returns_array = async function (connection) {
  connection.notes.last_queue = true
  return [903 /* DENYSOFT */, 'try later']
}
