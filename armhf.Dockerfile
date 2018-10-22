FROM arm32v7/node:6.14.2-stretch
MAINTAINER onegambler

# Install the required packages
RUN apt-get update && apt-get install -y bluetooth bluez libbluetooth-dev libudev-dev

# Copy mqtt-ble-scanner
ADD . /mqtt-ble-scanner

# Build mqtt-ble-scanner
WORKDIR /mqtt-ble-scanner
RUN npm set unsafe-perm true
RUN npm install --production

# Expose config volume
VOLUME /mqtt-ble-scanner/config

CMD ["node", "index.js"]
