const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Worker } = require('worker_threads');

let mainWindow;
const workers = new Map(); // To keep track of active workers


function createWorker(workerData) {
    return new Promise((resolve, reject) => {

        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData,
            env: {
                ...process.env, // Inherit existing environment variables
                JAVA_HOME: 'C:\\Program Files\\Java\\jdk-21', // Set JAVA_HOME
                PATH: `${process.env.PATH};C:\\Program Files\\Java\\jdk-21\\bin`, // Ensure Java binary is in PATH
            },
        });
        worker.on('message', (message) => {
            if (message.error) {
                reject(new Error(message.error));
            } else {
                resolve(message.result);
            }
        });

        worker.on('error', (error) => {
            reject(error);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
            workers.delete(worker.threadId);
        });

        workers.set(worker.threadId, worker);
    });
}

ipcMain.handle('create-driver', async (_, config) => {
    try {
        console.log('Create-driver', _, config);
        const result = await createWorker({ action: 'create-driver', config });
        return result;
    } catch (error) {
        console.error(`Failed to create driver: ${error.message}`);
        throw error;
    }
});

ipcMain.handle('execute-actions', async (_, { driverId, actions }) => {
    try {
        console.log(driverId, actions, "driverId, actions");
        const result = await createWorker({ action: 'execute-actions', driverId, actions });
        return result;
    } catch (error) {
        console.error(`Failed to execute actions: ${error.message}`);
        throw error;
    }
});

ipcMain.handle('stop-driver', async (_, driverId) => {
    try {
        const result = await createWorker({ action: 'stop-driver', driverId });
        return result;
    } catch (error) {
        console.error(`Failed to stop driver: ${error.message}`);
        throw error;
    }
});

ipcMain.handle('stop-all-drivers', async () => {
    try {
        // Terminate all workers
        for (const worker of workers.values()) {
            worker.terminate();
        }
        workers.clear();

        // Additionally, stop any remaining drivers
        const result = await createWorker({ action: 'stop-all-drivers' });
        return result;
    } catch (error) {
        console.error('Failed to stop all drivers and servers:', error.message);
        throw error;
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
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
    try {
        // Terminate all workers
        for (const worker of workers.values()) {
            worker.terminate();
        }
        workers.clear();
        await createWorker({ action: 'stop-all-drivers' });
    } catch (error) {
        console.error('Error during shutdown:', error.message);
    }
});
