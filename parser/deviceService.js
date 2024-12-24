const { remote } = require('webdriverio');
const appium = require('appium');

class DeviceService {
    constructor() {
        this.drivers = [];
        this.appiumServers = [];
    }

    async startAppiumServer(port) {
        try {
            const server = await appium.main({
                port,
                host: '0.0.0.0',
                args: { relaxedSecurity: true },
            });
            this.appiumServers.push({ port, server });
            console.log(`Appium server started on port ${port}`);
            return server;
        } catch (error) {
            console.error(`Failed to start Appium server on port ${port}:`, error.message);
            throw error;
        }
    }
//Different threads me drivers is different,
    async createDriver(config) {
        try {
            await this.startAppiumServer(config.port);

            const options = {
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
            };

            const driver = await remote(options);
            return driver;
        } catch (error) {
            console.error(`Error creating driver for ${config.deviceName}:`, error.message);
            throw error;
        }
    }

    async executeActions(driver, actions) {
        if (!driver) {
            throw new Error(`Driver ${driver} not found`);
        }
  
        try {
            for (const action of actions) {
                if (action.type === 'action' && action.action === 'click') {
                    const element = await driver.$(action.xpath);
                    await element.click();
                } else if (action.type === 'sleep') {
                    await new Promise((resolve) => setTimeout(resolve, action.value));
                }
            }
            console.log(`Actions executed on device: ${driver}`);
        } catch (error) {
            console.error(`Error executing actions on ${driver}:`, error.message);
            throw error;
        }
    }

    async stopDriver(driverId) {
        const driverData = this.drivers[driverId];
        if (!driverData) {
            console.error(`Driver ${driverId} not found.`);
            return;
        }

        try {
            await driverData.driver.deleteSession();
            this.drivers[driverId] = null; // Mark as stopped
            console.log(`Driver ${driverId} stopped successfully.`);
        } catch (error) {
            console.error(`Error stopping driver ${driverId}:`, error.message);
            throw error;
        }
    }

    async stopAllDrivers() {
        for (const driverData of this.drivers) {
            if (driverData && driverData.driver) {
                await driverData.driver.deleteSession();
                console.log(`Driver ${driverData.id} stopped.`);
            }
        }
        this.drivers = [];

        for (const { server, port } of this.appiumServers) {
            try {
                await server.close();
                console.log(`Appium server stopped on port ${port}`);
            } catch (error) {
                console.error(`Failed to stop Appium server on port ${port}:`, error.message);
            }
        }
        this.appiumServers = [];
    }
}

module.exports = new DeviceService();
