const { workerData, parentPort } = require('worker_threads');
const DeviceService = require('./parser/deviceService');

(async () => {
    try {
        const { action, config, driverId, actions } = workerData;

        if (action === 'create-driver') {
            const id = await DeviceService.createDriver(config);
            parentPort.postMessage({ result: `Driver ${id} created successfully.` });
        } else if (action === 'execute-actions') {
            await DeviceService.executeActions(driverId, actions);
            parentPort.postMessage({ result: `Actions executed on driver ${driverId}.` });
        } else if (action === 'stop-driver') {
            await DeviceService.stopDriver(driverId);
            parentPort.postMessage({ result: `Driver ${driverId} stopped successfully.` });
        } else if (action === 'stop-all-drivers') {
            await DeviceService.stopAllDrivers();
            parentPort.postMessage({ result: 'All drivers stopped successfully.' });
        } else {
            throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
})();
