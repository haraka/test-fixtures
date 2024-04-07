const assert = require('assert')

const logger = require('../lib/logger')

const plugin = { name: 'mock_plugin' }

// console.log(logger);
describe('logger', function () {
  it('exports logging functions', (done) => {
    assert.equal(typeof logger.loginfo, 'function')
    assert.equal(typeof logger.logwarn, 'function')
    assert.equal(typeof logger.logerror, 'function')
    assert.equal(typeof logger.log, 'function')
    done()
  })

  it('log', (done) => {
    assert.ok(logger.log('info', '_test log()_'))
    done()
  })

  it('loginfo', (done) => {
    assert.ok(logger.loginfo(plugin, '_test loginfo()_'))
    done()
  })
})
