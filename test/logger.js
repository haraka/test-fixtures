const assert = require('node:assert/strict')
const { describe, it, beforeEach, afterEach } = require('node:test')

const logger = require('../lib/logger')

const plugin = { name: 'mock_plugin' }

describe('logger', () => {
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
    const prev_loglevel = logger.loglevel
    logger.loglevel = logger.levels.INFO
    assert.ok(logger.loginfo(plugin, '_test loginfo()_'))
    logger.loglevel = prev_loglevel
  })

  it('log suppresses DEBUG and PROTOCOL output', () => {
    assert.equal(logger.log('DEBUG', 'hidden'), undefined)
    assert.equal(logger.log('PROTOCOL', 'hidden\n'), undefined)
  })
})

describe('set_loglevel', () => {
  let prev
  beforeEach(() => {
    prev = logger.loglevel
  })
  afterEach(() => {
    logger.loglevel = prev
  })

  it('accepts a level name (string)', () => {
    logger.set_loglevel('INFO')
    assert.equal(logger.loglevel, logger.levels.INFO)
  })

  it('accepts a numeric level', () => {
    logger.set_loglevel(3)
    assert.equal(logger.loglevel, 3)
  })

  it('falls back to WARN for an invalid level', () => {
    logger.set_loglevel('NOPE')
    assert.equal(logger.loglevel, logger.levels.WARN)
  })

  it('ignores null/undefined', () => {
    logger.loglevel = logger.levels.INFO
    logger.set_loglevel(undefined)
    assert.equal(logger.loglevel, logger.levels.INFO)
  })
})

describe('would_log', () => {
  it('reflects the current loglevel', () => {
    const prev = logger.loglevel
    logger.loglevel = logger.levels.WARN
    assert.equal(logger.would_log(logger.levels.DEBUG), false)
    assert.equal(logger.would_log(logger.levels.ERROR), true)
    logger.loglevel = prev
  })
})

describe('set_format / set_timestamps', () => {
  it('set_format accepts a known format, unknown -> DEFAULT', () => {
    logger.set_format('json')
    assert.equal(logger.format, logger.formats.JSON)
    logger.set_format('bogus')
    assert.equal(logger.format, logger.formats.DEFAULT)
  })

  it('set_timestamps coerces to boolean', () => {
    logger.set_timestamps(1)
    assert.equal(logger.timestamps, true)
    logger.set_timestamps(0)
    assert.equal(logger.timestamps, false)
  })
})

describe('log_if_level', () => {
  let prev
  beforeEach(() => {
    prev = logger.loglevel
    logger.loglevel = logger.levels.INFO
  })
  afterEach(() => {
    logger.loglevel = prev
  })

  it('uses an object .name as the plugin tag and inspects nameless objects', () => {
    const fn = logger.log_if_level('INFO', 'LOGINFO')
    assert.equal(fn({ name: 'myplugin' }, 'hello', { a: 1 }), true)
  })

  it('returns undefined when below the active loglevel', () => {
    logger.loglevel = logger.levels.ERROR
    const fn = logger.log_if_level('INFO', 'LOGINFO')
    assert.equal(fn('suppressed'), undefined)
  })
})
