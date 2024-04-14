const assert = require('assert')

const logger = require('../lib/logger')

const plugin = { name: 'mock_plugin' }

describe('logger', function () {
  it('exports logging functions', () => {
    assert.equal(typeof logger.loginfo, 'function')
    assert.equal(typeof logger.logwarn, 'function')
    assert.equal(typeof logger.logerror, 'function')
    assert.equal(typeof logger.log, 'function')
  })

  it('log', () => {
    assert.ok(logger.log('info', '_test log()_'))
  })

  it('loginfo', () => {
    assert.ok(logger.loginfo(plugin, '_test loginfo()_'))
  })
})
