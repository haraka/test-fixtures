'use strict';

var util = require('util');

var logger = exports;

logger.levels = {
    DATA:     9,
    PROTOCOL: 8,
    DEBUG:    7,
    INFO:     6,
    NOTICE:   5,
    WARN:     4,
    ERROR:    3,
    CRIT:     2,
    ALERT:    1,
    EMERG:    0,
};

logger.log = function (level, data) {
    if (level === 'PROTOCOL') {
        data = data.replace(/\n/g, '\\n\n');
    }
    if (level === 'DEBUG') return;
    if (level === 'PROTOCOL') return;
    data = data.replace(/\r/g, '\\r')
               .replace(/\n$/, '');

    console.log(data);
    return true;
};

logger.log_if_level = function (level, key, plugin) {
    return function () {
        if (logger.loglevel < logger[key]) return;
        var levelstr = '[' + level + ']';
        var str = '';
        var uuidstr = '[-]';
        var pluginstr = '[' + (plugin || 'core') + ']';
        for (var i=0; i < arguments.length; i++) {
            var data = arguments[i];
            if (typeof data !== 'object') {
                str += data;
                continue;
            }
            if (!data) continue;
            if (data.name) {
                pluginstr = '[' + data.name + ']';
            }
            else {
                str += util.inspect(data);
            }
        }
        logger.log(level, [levelstr, uuidstr, pluginstr, str].join(' '));
        return true;
    };
};

logger.add_log_methods = function (object, plugin) {
    if (!object) return;
    if (typeof(object) !== 'object') return;
    for (var level in logger.levels) {
        var fname = 'log' + level.toLowerCase();
        if (object[fname]) continue;  // already added
        object[fname] = logger.log_if_level(level, 'LOG'+level, plugin);
    }
};

logger.add_log_methods(logger, {name: 'test-fixture'});
