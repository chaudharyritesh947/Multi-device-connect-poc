const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { Worker, threadId } = require('worker_threads');

let mainWindow;
const workers = new Map(); // To keep track of active workers
const drivers = [];
const driverToWorkerMap = new Map(); // Map driver/session ID -> worker.threadId


function createWorker(workerData) {
    return new Promise((resolve, reject) => {
        let sessionId = null;
        const worker = new Worker(path.join(__dirname, 'worker.js'), {
            workerData:{...workerData, drivers},
            env: {
                ...process.env, // Inherit existing environment variables
                JAVA_HOME: 'C:\\Program Files\\Java\\jdk-21', // Set JAVA_HOME
                PATH: `${process.env.PATH};C:\\Program Files\\Java\\jdk-21\\bin`, // Ensure Java binary is in PATH
            },
        });
        worker.on('message', (message) => {
            const { type } = message; 
            if (type === 'update-drivers') {
                drivers.push(message.data); // Update drivers in the main thread
                console.log('Updated drivers in main thread:', drivers);
            }
            else if(type === 'create-driver'){
                drivers.push(message.sessionId); // Update drivers in the main thread
                sessionId = message.sessionId;
                resolve({worker, sessionId});
            } 
            else if (message.error) {
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

ipcMain.handle('print-drivers', async (_, config) => {
    try {
        console.log('p-driver', drivers);
        const result = await createWorker({ action: 'incr-pd' });
     
    } catch (error) {
        console.error(`Failed to create driver: ${error.message}`);
        throw error;
    }
});
ipcMain.handle('create-driver', async (_, config) => {
    try {
        const res = await createWorker({ action: 'create-driver', config });
      

        const { worker, sessionId  } = await res;
        driverToWorkerMap.set( sessionId, {threadId:worker.threadId, sessionId: sessionId });
        console.log(
            'result', 
            // drivers, 
            // driverToWorkerMap, 
            sessionId,  
            worker.threadId, "Post driver creation");
        return sessionId;
    } catch (error) {
        console.error(`Failed to create driver: ${error.message}`);
        throw error;
    }
});

ipcMain.handle('execute-actions', async (_, { sessionId, actions }) => {
    try {
        // console.log(driverId, actions, "driverId, actions");
        // const res ult = await createWorker({ 
        //      action: 'execute-actions',
        //      driverId,
        //      actions,
        //      driver: drivers[driverId],
        //      sessionId: drivers[driverId]
        //      });
        // return result;

        const workerThreadId = driverToWorkerMap.get(sessionId);
        console.log(driverToWorkerMap, workerThreadId, sessionId,  "workerThreadIdworkerThreadId")

        if (!workerThreadId) {
            throw new Error(`Worker not found for driver ${sessionId}`);
        }
        const worker = workers.get(workerThreadId.threadId);
        if (!worker) {
            throw new Error(`Worker thread ${workerThreadId} not found`);
        }
        try {
            const result = await new Promise((resolve, reject) => {
                worker.once('message', (message) => {
                    if (message.type === 'execute-actions' && message.driverId === sessionId) {
                        resolve(message.result);
                    } else if (message.error) {
                        reject(new Error(message.error));
                    }
                });
                worker.postMessage({ action: 'execute-actions', sessionId, actions });
            });
    
            console.log(`Actions executed for driver ${sessionId}`);
            return result;
        }
        catch(err){
            console.error(`Failed to execute actions: ${err.message}`);
            throw err;
        }
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
