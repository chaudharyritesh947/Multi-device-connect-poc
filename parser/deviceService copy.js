const { remote } = require('webdriverio');
const appium = require('appium');

class DeviceService {
    constructor() {
        this.drivers = [];
    }

    async startAppiumServer(port) {
        const server = await appium.main({
            port,
            host: '0.0.0.0',
            args: ['--relaxed-security'],
        });
        console.log(`Appium server started on port ${port}`);
        return server;
    }

    async createDriver(config) {
        await this.startAppiumServer(config.port);

        const driver = await remote({
            path: '/',
            port: config.port,
            hostname: 'localhost',
            capabilities: {
                platformName: config.platformName,
                'appium:deviceName': config.deviceName,
                'appium:platformVersion': config.platformVersion,
                'appium:udid': config.udid,
                'appium:app': config.app,
                'appium:automationName': config.automationName,
            },
        });

        this.drivers.push({ id: this.drivers.length, driver, config });
        console.log(`Driver created for device: ${config.deviceName}`);
        return this.drivers.length - 1;
    }

    async executeActions(driverId, actions) {
        const { driver, config } = this.drivers[driverId];
        for (const action of actions) {
            if (action.type === 'action' && action.action === 'click') {
                const element = await driver.$(action.xpath);
                await element.click();
            } else if (action.type === 'sleep') {
                await new Promise((resolve) => setTimeout(resolve, action.value));
            }
        }
        console.log(`Actions executed on device: ${config.deviceName}`);
    }
}

module.exports = new DeviceService();
