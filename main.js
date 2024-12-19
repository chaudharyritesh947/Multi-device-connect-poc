const DeviceService = require('./parser/deviceService');
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

//  
//     try {
//         await DeviceService.createDriver(config);
//         return `Driver created for device: ${config.deviceName}`;
//     } catch (error) {
//         throw new Error(`Failed to create driver: ${error.message}`);
//     }
// });

// ipcMain.handle('execute-actions', async (_, { driverIndex, actions }) => {
//     try {
//         await DeviceService.executeActions(driverIndex, actions);
//         return `Actions executed on driver ${driverIndex}`;
//     } catch (error) {
//         throw new Error(`Failed to execute actions: ${error.message}`);
//     }
// });

// ipcMain.handle('stop-driver', async (_, driverIndex) => {
//     try {
//         await DeviceService.stopDriver(driverIndex);
//         return `Driver ${driverIndex} stopped successfully`;
//     } catch (error) {
//         throw new Error(`Failed to stop driver: ${error.message}`);
//     }
// });

// ipcMain.handle('stop-all-drivers', async () => {
//     try {
//         await DeviceService.stopAllDrivers();
//         return 'All drivers stopped successfully';
//     } catch (error) {
//         throw new Error('Failed to stop all drivers');
//     }
// });

ipcMain.handle('create-driver', async (_, config) => {
    try {
        console.log(_," config")
        const driverId = await DeviceService.createDriver(config);
        return `Driver ${driverId} created for device: ${config.deviceName}`;
    } catch (error) {
        throw new Error(`Failed to create driver: ${error.message}`);
    }
});

ipcMain.handle('execute-actions', async (_, { driverId, actions }) => {
    try {
        await DeviceService.executeActions(driverId, actions);
        return `Actions executed on driver ${driverId}`;
    } catch (error) {
        throw new Error(`Failed to execute actions on driver ${driverId}: ${error.message}`);
    }
});

ipcMain.handle('stop-driver', async (_, driverId) => {
    try {
        await DeviceService.stopDriver(driverId);
        return `Driver ${driverId} stopped successfully`;
    } catch (error) {
        throw new Error(`Failed to stop driver ${driverId}: ${error.message}`);
    }
});

ipcMain.handle('stop-all-drivers', async () => {
    try {
        await DeviceService.stopAllDrivers();
        await DeviceService.stopAppiumServers();
        return 'All drivers and Appium servers stopped successfully';
    } catch (error) {
        throw new Error('Failed to stop all drivers and servers');
    }
});



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
    // await stopAllSessionsAndServers();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
