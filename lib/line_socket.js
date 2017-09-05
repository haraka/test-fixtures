'use strict';

const Events = require('events');

const stub   = require('./stub');

class Socket extends Events {
    constructor (port, host) {
        super();

        this.port = port;
        this.host = host;
        this.setTimeout = stub();
        this.setKeepAlive = stub();
        this.destroy = stub();
    }
}

exports.Socket = Socket;

exports.connect = function (port, host, cb) {
    return new Socket(port, host);
}
