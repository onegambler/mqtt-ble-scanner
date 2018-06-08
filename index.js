const config = require('config');

const publisher = require('./publishers');
const logger = require('./util/logger.js');

const enabledScanners = [];

function BLEScannerApp() {
    logger.info('Starting MQTT BLE Scanner...');

    if (config.get('app.unsafe')) {
        // catch the uncaught errors that weren't wrapped in a domain or try catch statement
        process.on('uncaughtException', function (err) {
            // handle the error safely
            logger.error(`Uncaught Exception {err}`);
        })
    }

    if (config.get('ble.enabled')) {
        const BLEScanner = require('./scanners/BLEScanner');
        const instance = new BLEScanner(config, publisher);
        instance.start();
        enabledScanners.push(instance);
    }

    process.on('exit', () => {
        enabledScanners.forEach(scanner => scanner.stop());
        publisher.teardown();
    });
}

// start the app
const app = new BLEScannerApp();
