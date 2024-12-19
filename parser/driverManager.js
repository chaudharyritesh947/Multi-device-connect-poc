const { remote } = require('webdriverio');

class DriverManager {
    constructor(deviceConfig) {
        this.deviceConfig = deviceConfig;
        this.driver = null;
    }

    async initialize() {
        const options = {
            path: '/',
            port: this.deviceConfig.port,
            hostname: 'localhost',
            capabilities: {
                platformName: this.deviceConfig.platformName,
                'appium:deviceName': this.deviceConfig['appium:deviceName'],
                'appium:platformVersion': this.deviceConfig['appium:platformVersion'],
                'appium:udid': this.deviceConfig['appium:udid'],
                'appium:app': this.deviceConfig['appium:app'],
                'appium:automationName': this.deviceConfig['appium:automationName'],
            },
        };

        try {
            console.log(`Initializing driver for device: ${this.deviceConfig['appium:deviceName']}...`);
            this.driver = await remote(options);
            console.log(`Driver initialized for device: ${this.deviceConfig['appium:deviceName']}`);
        } catch (error) {
            console.error(`Error initializing driver for ${this.deviceConfig['appium:deviceName']}:`, error.message);
            throw error;
        }
    }

    async executeActions(actions) {
        try {
            for (const action of actions) {
                if (action.type === 'action' && action.action === 'click') {
                    const element = await this.driver.$(action.xpath);
                    await element.click();
                } else if (action.type === 'sleep') {
                    await new Promise(resolve => setTimeout(resolve, action.value));
                }
            }
        } catch (error) {
            console.error(`Error executing actions: ${error.message}`);
        }
    }

    async stop() {
        if (this.driver) {
            await this.driver.deleteSession();
            console.log(`Session stopped for device: ${this.deviceConfig['appium:deviceName']}`);
        }
    }
}

module.exports = DriverManager;
