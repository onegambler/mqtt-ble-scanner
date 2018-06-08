const mqtt = require('mqtt');

class MQTTPublisher {

    constructor(config, options) {
        this.config = config;
        this.options = options;
        const authenticationOptions = {
            username: config.get('mqtt.username'),
            password: config.get('mqtt.password'),
            rejectUnauthorized: config.get('mqtt.reject_unauthorized')
        };
        this.client = mqtt.connect(config.get('mqtt.url'), authenticationOptions);
        this.topic = config.get('mqtt.topic');
    }

    publish(device, callback) {
        this.client.publish(this.topic, JSON.stringify(device), this.options, callback);
    }

    teardown() {
        this.client.end();
    }
}

module.exports = MQTTPublisher;
