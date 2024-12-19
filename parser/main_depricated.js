const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { remote } = require('webdriverio');
const appium = require('appium');

let mainWindow;

//We dont have session polling.
//:->permissiable 
/*
every device should have a sep port
* is there any concept of not closing the session
-> Ameer 



Ameer's Feedback.
 - 

*/
// Define device configurations
const devices = [
    {
        "port": 4723,
        "platformName": 'Android',
        'appium:deviceName': 'Redmi 9',
        'appium:platformVersion': '10',
        'appium:udid': 'EE6HQWAQ4X7XQG7L',
        'appium:app': 'D:\\APIDemos.apk',
        'appium:automationName': 'UiAutomator2',
        xpaths: [
            {
               type: "action",
               action: "click",
               xpath:'//android.widget.TextView[@content-desc="Animation"]'
            },
            {
                type: "sleep",
                value: 10000
             },
            {
                type: "action",
                action: "click",
                xpath:'//android.widget.TextView[@content-desc="Cloning"]'
             },
             {
                type: "action",
                action: "click",
                xpath:'//android.widget.Button[@content-desc="Run"]'
             },
        ]
    },
    {
        port: 4724,
        platformName: 'Android',
        'appium:deviceName': 'Redmi 6',
        'appium:platformVersion': '10',
        'appium:udid': 'de47d8917d29',
        'appium:app': 'D:\\APIDemos.apk',
        'appium:automationName': 'UiAutomator2',
        xpaths: [
            {
               type: "action",
               action: "click",
               xpath:'//android.widget.TextView[@content-desc="Views"]'
            },
            {
                type: "sleep",
                value: 1000
             },
             {
                type: "action",
                action: "click",
                xpath:'//android.widget.TextView[@content-desc="Animation"]'
             },
             {
                type: "action",
                action: "click",
                xpath:'//android.widget.TextView[@content-desc="Push"]'
             },
        ]    }
];


let appiumServers = [];
let sessions = [];

/**
 * Start an Appium server on the specified port
 */
async function startAppiumServer(port) {
    try {
        const server = await appium.main({
            port,
            host: '0.0.0.0',
            args: ['--relaxed-security'],
        });
        appiumServers.push(server);
        console.log(`Appium server started successfully on port ${port}`);
    } catch (error) {
        console.error(`Failed to start Appium server on port ${port}:`, error.message);
        throw error;
    }
}

/**
 * Start a session on a specific device
 */
async function startSession(deviceConfig, idx) {
    const options = {
        path: '/',
        port: deviceConfig.port,
        hostname: 'localhost',
        capabilities: {
            platformName: deviceConfig?.platformName,
            'appium:deviceName': deviceConfig['appium:deviceName'],
            'appium:platformVersion': deviceConfig['appium:platformVersion'],
           'appium:udid': deviceConfig['appium:udid'],
           'appium:app': deviceConfig['appium:app'],
           'appium:automationName': deviceConfig['appium:automationName'],
        },
    };

    try {
        const xpaths = deviceConfig?.xpaths;

        console.log(`Starting session for device: ${deviceConfig['appium:deviceName']}...`);
        const driver = await remote(options);
        if(driver && xpaths){
            
            if(idx == 0){
              
                const element1 = await driver.$('//android.widget.TextView[@content-desc="Animation"]');
                await element1.click();

                setTimeout(()=>{}, 10000)        

                    
                const element2 = await driver.$('//android.widget.TextView[@content-desc="Cloning"]');
                await element2.click();

           
                const element3 = await driver.$('//android.widget.Button[@content-desc="Run"]');
                await element3.click();
       
            }
            else if (idx == 1){

                const element1 = await driver.$('//android.widget.TextView[@content-desc="Views"]');
                await element1.click();

                setTimeout(()=>{}, 1000)        

                    
                const element2 = await driver.$('//android.widget.TextView[@content-desc="Animation"]');
                await element2.click();

           
                const element3 = await driver.$('//android.widget.TextView[@content-desc="Push"]');
                await element3.click();

            }
            //xpaths is array
            // for (const xpath of xpaths) {
            //     if(xpath.type == "action"){
            //         const element = await driver.$(xpath);
            //         await element.click();

            //     }
            //     else if(xpath.type == "sleep"){
            //     }
            // }
        }
         
        sessions.push(driver);
        console.log(`Session started for device: ${deviceConfig['appium:deviceName']}`);
        return driver;
    } catch (error) {
        console.error(
            `Failed to start session for device ${deviceConfig['appium:deviceName']}:`,
            error.message
        );
        throw error;
    }
}

/**
 * Stop all active sessions and Appium servers
 */
async function stopAllSessionsAndServers() {
    // Stop all WebDriverIO sessions
    for (const driver of sessions) {
        await driver.deleteSession();
    }
    sessions = [];

    // Stop all Appium servers
    for (const server of appiumServers) {
        await server.close();
    }
    appiumServers = [];
    console.log('All sessions and Appium servers have been stopped');
}

/**
 * IPC Handlers
 */

// Start parallel tests
ipcMain.handle('run-parallel-tests', async () => {
    try {
        // Start Appium servers for all devices
        for (const device of devices) {
            await startAppiumServer(device.port);
        }

        // Start WebDriverIO sessions for all devices
        // const drivers = await Promise.all(
        //     devices.map((device) => startSession(device))
        // );
      
        const drivers = await Promise.any(
            devices.map((device, idx) => startSession(device, idx))
        );


        return drivers.map(
            (_, index) =>
                `Session successfully started on device: ${devices[index]['appium:deviceName']}`
        );
    } catch (error) {
        console.error('Error during parallel test execution:', error.message);
        throw error;
    }
});

// Stop all sessions
ipcMain.handle('stop-sessions', async () => {
    try {
        await stopAllSessionsAndServers();
        return 'All sessions and Appium servers stopped successfully';
    } catch (error) {
        console.error('Error while stopping sessions:', error.message);
        throw error;
    }
});

ipcMain.handle('execute-paraelley', async (drivers) => {
    try {
        Promise.all(drivers.map())
        await stopAllSessionsAndServers();
        return 'All sessions and Appium servers stopped successfully';
    } catch (error) {
        console.error('Error while stopping sessions:', error.message);
        throw error;
    }
});

// Start a single test session
ipcMain.handle('start-single-session', async (_, deviceIndex) => {
    try {
        const device = devices[deviceIndex];
        await startAppiumServer(device.port);
        const driver = await startSession(device);
        return `Session successfully started on device: ${device['appium:deviceName']}`;
    } catch (error) {
        console.error('Error during single test execution:', error.message);
        throw error;
    }
});

/**
 * Electron App Initialization
 */

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
        },
    });

    mainWindow.loadURL('http://localhost:3000'); 
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', async () => {
    console.log('Stopping all sessions and servers...');
    await stopAllSessionsAndServers();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
