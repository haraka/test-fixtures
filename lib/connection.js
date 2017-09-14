'use strict';

const Notes       = require('haraka-notes')
const ResultStore = require('haraka-results')

const logger      = require('./logger')

const connection  = exports;

function Connection (client, server) {
    this.client = client;
    this.server = server;
    this.relaying = false;
    this.local = {};
    this.remote = {};
    this.tls = {};
    this.hello = {};
    this.notes  = new Notes();
    this.set = function (obj, prop, val) {
        if (!this[obj]) this.obj = {};
        this[obj][prop] = val;
        this[obj + '_' + prop] = val;  // sunset v3.0.0
    };
    this.results = new ResultStore(this);
    logger.add_log_methods(this, 'mock-connection');
}

connection.createConnection = function (client, server) {
    if (typeof(client) === 'undefined') {
        client = {};
    }

    if (typeof(server) === 'undefined') {
        server = {};
    }

    const obj = new Connection(client, server);

    obj.respond = function (code, msg, func) { return func(); };

    obj.reset_transaction = function (done) {
        if (this.transaction && this.transaction.resetting === false) {
            this.transaction.resetting = true;
        }
        else {
            this.transaction = null;
        }
        if (done) done();
    };

    obj.auth_results = function (message) {};

    obj.remote.ip = '127.0.0.1';

    return obj;
};
