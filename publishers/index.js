const _ = require('lodash');
const config = require('config');

const logger = require('../util/logger');

const DEFAULT_UPDATE_FREQUENCY = 50;
const UPDATE_FREQUENCY = calculateUpdateFrequency(config.get('app.update_frequency'));
const SHOULD_AGGREGATE = config.has('app.aggregate') && config.get("app.aggregate");

const publishers = [];
let foundDevicesMap = {};

if (config.get('mqtt.enabled')) {
    const MQTTPublisher = require('./MQTTPublisher');
    publishers.push(new MQTTPublisher(config, {}));
}
if (config.get('console.enabled')) {
    const ConsolePublisher = require('./ConsolePublisher');
    publishers.push(new ConsolePublisher());
}

function calculateUpdateFrequency(configFrequency) {
    if (!configFrequency) {
        return DEFAULT_UPDATE_FREQUENCY;
    }
    const frequency = parseInt(configFrequency);

    return frequency > DEFAULT_UPDATE_FREQUENCY ? frequency : DEFAULT_UPDATE_FREQUENCY;
}

const publishJob = setInterval(() => {
    let devices = Object.keys(foundDevicesMap).map((key) => foundDevicesMap[key]);
    if (SHOULD_AGGREGATE && !_.isEmpty(devices)) {
        publishers.forEach(publisher => publisher.publish(devices, publishCallback));
    } else {
        devices.forEach(device => {
            publishers.forEach(publisher => publisher.publish(device, publishCallback));
        });
    }
    logger.debug(`Publishing identified devices: [${devices.map(value => value.id)}]`);

    foundDevicesMap = {}

}, UPDATE_FREQUENCY);

const publishCallback = (error) => {
    if (error) {
        logger.error('Failed to publish message');
    }
};

module.exports = {
    publish: device => {
        foundDevicesMap[device.id] = device
    },
    teardown: () => {
        clearInterval(publishJob);
        publishers.forEach(publisher => publisher.teardown());
    }
};