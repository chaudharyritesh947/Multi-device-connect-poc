const { workerData, parentPort } = require('worker_threads');
const DeviceService = require('./parser/deviceService');

const drivers = new Map();



// Listener for messages from the main thread
parentPort.on('message', async (message) => {
    try {
        const { action, config, driverId, actions, sessionId } = message;

        if (action === 'create-driver') {
            // Create a new driver instance and store it
            const driver = await DeviceService.createDriver(config);
            drivers.set(driver.sessionId, driver);
            parentPort.postMessage({
                type: 'create-driver',
                sessionId: driver.sessionId,
                result: `Driver created with sessionId: ${driver.sessionId}`,
            });
        } 
        // else if (action === 'execute-actions') {
        //     // Fetch the driver instance by sessionId

        //     const driver = drivers.get(sessionId);
        //     if (!driver) {
        //         parentPort.postMessage({
        //             type: 'error',
        //             driverId: sessionId,
        //             error: `Driver ${sessionId} not found`,
        //         });
        //         return;
        //     }

        //     try {
        //         // Execute the requested actions
        //         await DeviceService.executeActions(driver, actions);
        //         parentPort.postMessage({
        //             type: 'execute-actions',
        //             driverId: sessionId,
        //             result: `Actions executed on driver ${sessionId}.`,
        //         });
        //     } catch (error) {
        //         parentPort.postMessage({
        //             type: 'error',
        //             driverId: sessionId,
        //             error: error.message,
        //         });
        //     }
        // } 
        else if (action === 'execute-actions') {
            const driver = drivers.get(sessionId);
            if (!driver) {
                parentPort.postMessage({
                    type: 'error',
                    driverId: sessionId,
                    error: `Driver ${sessionId} not found`,
                });
                return;
            }
    
            try {
                for (let i = 0; i < actions.length; i++) {
                    const step = actions[i];
                    if (step.type === 'action' && step.action === 'click') {
                        const element = await driver.$(step.xpath);
                        await element.click();
                    } else if (step.type === 'sleep') {
                        await new Promise((resolve) => setTimeout(resolve, step.value));
                    }
    
                    // Send progress update
                    parentPort.postMessage({
                        type: 'progress',
                        sessionId,
                        progress: Math.round(((i + 1) / actions.length) * 100),
                        stepDescription: `Executing step ${i + 1}/${actions.length}: ${step.action || 'sleep'}`,
                    });
                }
    
                parentPort.postMessage({
                    type: 'execute-actions',
                    driverId: sessionId,
                    result: `Actions executed on driver ${sessionId}.`,
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'error',
                    driverId: sessionId,
                    error: error.message,
                });
            }
        }
        else if (action === 'stop-driver') {
            // Stop a specific driver
            const driver = drivers.get(driverId);
            if (!driver) {
                parentPort.postMessage({
                    type: 'error',
                    driverId,
                    error: `Driver ${driverId} not found`,
                });
                return;
            }

            try {
                await driver.deleteSession();
                drivers.delete(driverId);
                parentPort.postMessage({
                    type: 'stop-driver',
                    driverId,
                    result: `Driver ${driverId} stopped successfully.`,
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'error',
                    driverId,
                    error: error.message,
                });
            }
        } else if (action === 'stop-all-drivers') {
            // Stop all active drivers
            try {
                for (const [sessionId, driver] of drivers.entries()) {
                    await driver.deleteSession();
                    drivers.delete(sessionId);
                }
                parentPort.postMessage({
                    type: 'stop-all-drivers',
                    result: 'All drivers stopped successfully.',
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'error',
                    error: error.message,
                });
            }
        } else {
            // Handle unknown actions
            throw new Error(`Unknown action: ${action}`);
        }


     
    } catch (error) {
        // Send an error message back to the main thread
        parentPort.postMessage({
            type: 'error',
            error: error.message,
        });
    }
});


(async () => {
    try {
        const { action, config, driverId, actions, sessionId } = workerData;

        if (action === 'incr-pd') {
            const d = new Date();
            drivers.set(d.toISOString(), d); // Use a unique identifier as key
            parentPort.postMessage({ type: 'update-drivers', data: d }); // Notify the main thread
        } else if (action === 'create-driver') {
            const driver = await DeviceService.createDriver(config);
            drivers.set(driver.sessionId, driver); // Store the driver in the map
            parentPort.postMessage({
                type: 'create-driver',
                sessionId: driver.sessionId,
                result: `Driver created with sessionId: ${driver.sessionId}`,
            });
        } else if (action === 'execute-actions') {
            const driver = drivers.get(sessionId);
            if (!driver) {
                parentPort.postMessage({
                    type: 'error',
                    driverId: sessionId,
                    error: `Driver ${sessionId} not found`,
                });
                return;
            }

            try {
                await DeviceService.executeActions(driver, actions);
                parentPort.postMessage({
                    type: 'execute-actions',
                    driverId: sessionId,
                    result: `Actions executed on driver ${sessionId}.`,
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'error',
                    driverId: sessionId,
                    error: error.message,
                });
            }
        } else if (action === 'stop-driver') {
            try {
                await DeviceService.stopDriver(driverId);
                drivers.delete(driverId); // Remove the driver from the map
                parentPort.postMessage({
                    type: 'stop-driver',
                    driverId,
                    result: `Driver ${driverId} stopped successfully.`,
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'error',
                    driverId,
                    error: error.message,
                });
            }
        } else if (action === 'stop-all-drivers') {
            try {
                for (const [sessionId, driver] of drivers.entries()) {
                    await driver.deleteSession();
                    drivers.delete(sessionId);
                }
                parentPort.postMessage({
                    type: 'stop-all-drivers',
                    result: 'All drivers stopped successfully.',
                });
            } catch (error) {
                parentPort.postMessage({
                    type: 'error',
                    error: error.message,
                });
            }
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        parentPort.postMessage({ type: 'error', error: error.message });
    }
})();
