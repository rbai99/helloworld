var log4js = require('log4js')

log4js.configure({
    appenders: [
        {
            type: 'console'
        },
        {
            type: 'file',
            filename: 'logs/normal.log',
            pattern: '-yyyy-MM-dd',
            alwaysIncludePattern: false,
            maxLogSize: 1048576,
            backups:3,
            category: 'normal'
        }
    ],
    replaceConsole: false,
    levels: {
        normal: 'INFO'
    }
});
// six levels: trace, debug, info, warn, error, fatal

var normalLogger = log4js.getLogger('normal');

exports.logger = normalLogger;