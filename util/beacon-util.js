const EXPECTED_MANUFACTURER_DATA_LENGTH = 25;
const APPLE_COMPANY_IDENTIFIER = 0x004c; // https://www.bluetooth.org/en-us/specification/assigned-numbers/company-identifiers
const IBEACON_TYPE = 0x02;
const EXPECTED_IBEACON_DATA_LENGTH = 0x15;

const calculateDistance = (rssi, txPower) => {
    if (rssi === 0 || txPower === 0) {
        return -1.0;
    }

    const ratio = rssi * 1.0 / txPower;
    if (ratio < 1.0) {
        return Math.pow(ratio, 10);
    }
    else {
        return (0.89976) * Math.pow(ratio, 7.7095) + 0.111;
    }
};

const isIBeacon = peripheral => {
    const manufacturerData = peripheral.advertisement.manufacturerData;
    return manufacturerData &&
        EXPECTED_MANUFACTURER_DATA_LENGTH <= manufacturerData.length &&
        APPLE_COMPANY_IDENTIFIER === manufacturerData.readUInt16LE(0) &&
        IBEACON_TYPE === manufacturerData.readUInt8(2) &&
        EXPECTED_IBEACON_DATA_LENGTH === manufacturerData.readUInt8(3);
};

const getIBeaconData = peripheral => {
    const manufacturerData = peripheral.advertisement.manufacturerData;
    const rssi = peripheral.rssi;
    const mac = peripheral.address;
    const uuid = manufacturerData.slice(4, 20).toString('hex');
    const major = manufacturerData.readUInt16BE(20);
    const minor = manufacturerData.readUInt16BE(22);
    const measuredPower = manufacturerData.readInt8(24);
    const distance = calculateDistance(rssi, measuredPower || -59);

    // const accuracy = Math.pow(12.0, 1.5 * ((rssi / measuredPower) - 1));
    const accuracy = calculateDistance(rssi, measuredPower);
    let proximity = null;

    if (accuracy < 0) {
        proximity = 'unknown';
    } else if (accuracy < 0.5) {
        proximity = 'immediate';
    } else if (accuracy < 4.0) {
        proximity = 'near';
    } else {
        proximity = 'far';
    }

    return {
        uuid,
        mac,
        major,
        minor,
        measuredPower,
        accuracy,
        rssi,
        distance,
        proximity
    };
};

const getGenericBeaconData = (peripheral, useMac) => {
    const advertisement = peripheral.advertisement;
    const id = useMac ? peripheral.address : peripheral.id;
    const txPower = advertisement.txPowerLevel || -59;
    const distance = calculateDistance(peripheral.rssi, txPower);
    return {
        id: id,
        name: advertisement.localName,
        mac:peripheral.address,
        rssi: peripheral.rssi,
        distance: distance
    }
};

module.exports = {isIBeacon, getIBeaconData, getGenericBeaconData};