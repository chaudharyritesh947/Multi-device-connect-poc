const { remote } = require('webdriverio');
const appium = require('appium');

class DeviceService {
    constructor() {
        this.drivers = [];
        this.appiumServers = [];
    }

    /**
     * Start Appium server and return the server instance.
     */
    async startAppiumServer(port) {
        try {
            const server = await appium.main({
                port,
                host: '0.0.0.0',
                args: ['--relaxed-security'],
            });
            this.appiumServers.push({ port, server });
            console.log(`Appium server started on port ${port}`);
            return server;
        } catch (error) {
            console.error(`Failed to start Appium server on port ${port}:`, error.message);
            throw error;
        }
    }

    /**
     * Check if a port is already in use and find an available one.
     */
    async getAvailablePort(startPort) {
        const netstat = require('node-netstat'); // Install with npm
        const usedPorts = new Set();

        // Capture all used ports
        netstat({ filter: { state: 'LISTEN' } }, (data) => {
            usedPorts.add(data.local.port);
        });

        let availablePort = startPort;
        while (usedPorts.has(availablePort)) {
            availablePort++;
        }

        return availablePort;
    }

    /**
     * Create a WebDriverIO driver and start its session.
     */
    async createDriver(config) {
        try {
            // const port = await this.getAvailablePort(config.port);
            await this.startAppiumServer(config.port);

            const options = {
                path: '/',
                port:config.port,
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
            this.drivers.push({ id: this.drivers.length, driver, config });
            console.log(`Driver created for device: ${config.deviceName}`);
            return this.drivers.length - 1; // Return the driver ID
        } catch (error) {
            console.error(`Error creating driver for ${config.deviceName}:`, error.message);
            throw error;
        }
    }

    /**
     * Stop all Appium servers.
     */
    async stopAppiumServers() {
        for (const { server, port } of this.appiumServers) {
            await server.close();
            console.log(`Appium server stopped on port ${port}`);
        }
        this.appiumServers = [];
    }

    async executeActions(driverIndex, actions) {
        const { driver, config } = this.drivers[driverIndex];
        try {
            for (const action of actions) {
                if (action.type === 'action' && action.action === 'click') {
                    const element = await driver.$(action.xpath);
                    await element.click();
                } else if (action.type === 'sleep') {
                    await new Promise(resolve => setTimeout(resolve, action.value));
                }
            }
            console.log(`Actions executed on device: ${config.deviceName}`);
        } catch (error) {
            console.error(`Error executing actions on ${config.deviceName}:`, error.message);
            throw error;
        }
    }

}

module.exports = new DeviceService();
