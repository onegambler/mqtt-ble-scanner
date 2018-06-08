const _ = require('lodash');
const noble = require('noble');
const KalmanFilter = require('kalmanjs').default;
const {getIBeaconData, isIBeacon, getGenericBeaconData} = require('../util/beacon-util');
const logger = require('../util/logger');

class BLEScanner {

    constructor(config, publisher) {
        this.publisher = publisher;
        this.config = config;
        this.kalmanManager = {};
        this.whitelist = this.config.get('ble.whitelist') || [];
        this.blacklist = this.config.get('ble.blacklist') || [];
        this.majorMask = this.getMask('ble.ibeacon.major_mask');
        this.minorMask = this.getMask('ble.ibeacon.minor_mask');
        noble.on('stateChange', this.stateChange);
        noble.on('discover', this.onDiscovery.bind(this));
    }

    getMask(maskNameConfig) {
        const mask = this.config.has(maskNameConfig);
        return mask ? mask : 0xFFFF;
    }

    start() {
        noble.on('stateChange', this.stateChange);
    }

    stop() {
        noble.removeAllListeners('stateChange');
        noble.stopScanning();
    }

    stateChange(state) {
        if (state === 'poweredOn') {
            logger.info('Started BLE scanning... ');
            noble.startScanning([], true);
        }
        else {
            logger.info('Stopped BLE scanning... ');
            noble.stopScanning();
        }
    }

    onDiscovery(peripheral) {
        let beacon;
        if (isIBeacon(peripheral)) {
            beacon = getIBeaconData(peripheral);
            beacon.id = `${beacon.uuid}-${beacon.major & this.majorMask}-${beacon.minor & this.minorMask}`;
        } else {
            beacon = getGenericBeaconData(peripheral);
        }

        if (this.isWhitelisted(beacon.id) && !this.isBlacklisted(beacon.id)) {
            const maxDistance = this.config.get('ble.max_distance') || 0;
            if (maxDistance === 0 || beacon.distance <= maxDistance) {
                beacon.distance = this.filter(beacon.id, beacon.distance);
                this.publisher.publish(beacon);
            }
        }
    }

    isBlacklisted(id) {
        return !_.isEmpty(this.blacklist) && _.includes(this.blacklist, id);
    }

    isWhitelisted(id) {
        return _.isEmpty(this.whitelist) || _.includes(this.whitelist, id);
    }

    filter(id, distance) {
        if (!_.has(this.kalmanManager, id)) {
            this.kalmanManager[id] = new KalmanFilter({
                R: this.config.get('ble.system_noise') || 0.01,
                Q: this.config.get('ble.measurement_noise') || 3
            });
        }

        return this.kalmanManager[id].filter(distance);
    }
}


module.exports = BLEScanner;