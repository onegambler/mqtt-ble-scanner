const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;

const defaultFormat = printf(info => {
    return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
    level: 'info',
    format: combine(
        label({ label: 'MQTT BLE Scanner' }),
        timestamp(),
        defaultFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'error.log', level: 'error' }),
        new transports.File({ filename: 'ble-scanner.log' })
    ]
});

module.exports = logger;