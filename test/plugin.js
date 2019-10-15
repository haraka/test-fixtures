
const assert = require('assert');

const path   = require('path');

const Plugin = require('../lib/plugin');

describe('plugin', function () {

    it('exports a Plugin function', (done) => {
        assert.equal(typeof Plugin, 'function');
        done();
    })

    it('creates a new Plugin from .js', (done) => {
        const newPlugin = new Plugin(path.join('test','fixtures','mock-plugin'));
        // console.log(newPlugin);
        assert.ok(newPlugin);
        done();
    })

    it('creates a new Plugin from dir', (done) => {
        const newPlugin = new Plugin(path.join('test','fixtures','mock-plugin-dir'));
        // console.log(newPlugin);
        assert.ok(newPlugin);
        done();
    })

    describe('register', function () {

        beforeEach(done => {
            // console.log(Plugin);
            this.plugin = new Plugin(path.join('test','fixtures','mock-plugin-dir'));
            done();
        })

        it('register exists', (done) => {
            // console.log(this.plugin);
            assert.equal(typeof this.plugin.register, 'function');
            done();
        })

        it('register runs', (done) => {
            this.plugin.register();
            assert.ok(true); // register() didn't throw
            done();
        })
    })

    it('can register plugin with ineritance', (done) => {
        const pi = new Plugin(path.join('test','fixtures','mock-plugin'));
        assert.equal(typeof pi.register, 'function');
        pi.register();
        assert.ok(Object.keys(pi.base));
        done();
    })

    it('plugin name remains the same after a plugin inherits', (done) => {
        const pi = new Plugin(path.join('test','fixtures','mock-plugin'));
        assert.equal(typeof pi.register, 'function');
        pi.register();
        assert.equal(pi.name, path.join('test','fixtures','mock-plugin'));
        done();
    })
})
