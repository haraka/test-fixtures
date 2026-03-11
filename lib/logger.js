const util = require('node:util')

const logger = exports

logger.levels = {
  DATA: 9,
  PROTOCOL: 8,
  DEBUG: 7,
  INFO: 6,
  NOTICE: 5,
  WARN: 4,
  ERROR: 3,
  CRIT: 2,
  ALERT: 1,
  EMERG: 0,
}

// Add LOG* aliases
for (const level in logger.levels) {
  logger[`LOG${level}`] = logger.levels[level]
}

logger.formats = {
  DEFAULT: 'DEFAULT',
  LOGFMT: 'LOGFMT',
  JSON: 'JSON',
}

logger.loglevel = logger.levels.WARN
logger.format = logger.formats.DEFAULT
logger.timestamps = false
logger.deferred_logs = []

logger.log = function (level, data) {
  if (level === 'PROTOCOL') {
    data = data.replace(/\n/g, '\\n\n')
    return
  }
  if (level === 'DEBUG') return
  data = data.replace(/\r/g, '\\r').replace(/\n$/, '')

  console.log(data)
  return true
}

logger.set_loglevel = function (level) {
  if (level === undefined || level === null) return

  const loglevel_num = parseInt(level)
  if (typeof level === 'string') {
    logger.loglevel = logger.levels[level.toUpperCase()]
  } else {
    logger.loglevel = loglevel_num
  }

  if (!Number.isInteger(logger.loglevel)) {
    logger.loglevel = logger.levels.WARN
  }
}

logger.would_log = function (level) {
  if (logger.loglevel < level) return false
  return true
}

logger.set_format = function (format) {
  if (format) {
    logger.format = logger.formats[format.toUpperCase()]
  }
  if (!logger.format) {
    logger.format = logger.formats.DEFAULT
  }
}

logger.set_timestamps = function (value) {
  logger.timestamps = !!value
}

logger.log_if_level = function (level, key, plugin) {
  return function () {
    if (logger.loglevel < logger[key]) return
    const levelstr = `[${level}]`
    let str = ''
    const uuidstr = '[-]'
    let pluginstr = `[${plugin || 'core'}]`
    for (let i = 0; i < arguments.length; i++) {
      const data = arguments[i]
      if (typeof data !== 'object') {
        str += data
        continue
      }
      if (!data) continue
      if (data.name) {
        pluginstr = `[${data.name}]`
      } else {
        str += util.inspect(data)
      }
    }
    logger.log(level, [levelstr, uuidstr, pluginstr, str].join(' '))
    return true
  }
}

logger.add_log_methods = function (object, plugin) {
  if (!object) return
  if (typeof object !== 'object') return
  for (const level in logger.levels) {
    const fname = `log${level.toLowerCase()}`
    if (object[fname]) continue // already added
    object[fname] = logger.log_if_level(level, `LOG${level}`, plugin)
  }
}

logger.add_log_methods(logger, { name: 'test-fixture' })
