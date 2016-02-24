'use strict';

var events = require('events');
var util   = require('util');

function Socket (port, host) {
    events.EventEmitter.call(this);
    this.port = port;
    this.host = host;
    this.setTimeout = exports.stub();
    this.setKeepAlive = exports.stub();
    this.destroy = exports.stub();
}

util.inherits(Socket, events.EventEmitter);

exports.Socket = Socket;

exports.connect = function (port, host, cb) {
    return new Socket(port, host);
}
