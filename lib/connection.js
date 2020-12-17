
const Notes       = require('haraka-notes')
const ResultStore = require('haraka-results')

const logger      = require('./logger')
const transaction = require('./transaction')

const cfg = {
    main: {
        smtputf8: true
    },
    headers: {
        add_received: true,
        clean_auth_results: true,
        max_lines: 1000,
        max_received: 100,
    }
}

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
        this.results = new ResultStore(this);
        logger.add_log_methods(this, 'mock-connection');
    }
    auth_results (message) {}
    respond (code, msg, func) { return func(); }
    init_transaction (done) {
        this.transaction = new transaction.createTransaction(null, cfg);
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
    set (prop_str, val) {
        if (arguments.length === 3) {
            prop_str = `${arguments[0]}.${arguments[1]}`;
            val = arguments[2];
        }

        const segments = prop_str.split('.');
        let dest = this;
        while (segments.length > 1) {
            if (!dest[segments[0]]) dest[segments[0]] = {};
            dest = dest[segments.shift()];
        }
        dest[segments[0]] = val;
    }
    get (prop_str) {
        return prop_str.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : undefined
        }, this)
    }
}

exports.Connection = Connection;

exports.createConnection = function (client, server) {
    if (typeof(client) === 'undefined') client = {};
    if (typeof(server) === 'undefined') server = {};

    return new Connection(client, server);
}
