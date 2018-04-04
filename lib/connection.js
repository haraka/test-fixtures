
const Notes       = require('haraka-notes')
const ResultStore = require('haraka-results')

const logger      = require('./logger')
const transaction = require('./transaction')

class Connection {
    constructor (client, server) {

        this.client = client;
        this.server = server;
        this.relaying = false;
        this.local = {};
        this.remote = {
            ip: '127.0.0.1',
        };
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
    auth_results (message) {}
    respond (code, msg, func) { return func(); }
    init_transaction (done) {
        this.transaction = new transaction.createTransaction();
        this.transaction.results = new ResultStore(this);
        if (done) done();
    }
    reset_transaction (done) {
        if (this.transaction && this.transaction.resetting === false) {
            this.transaction.resetting = true;
        }
        else {
            this.transaction = null;
        }
        if (done) done();
    }
}

exports.Connection = Connection;

exports.createConnection = function (client, server) {
    if (typeof(client) === 'undefined') client = {};
    if (typeof(server) === 'undefined') server = {};

    return new Connection(client, server);
}
