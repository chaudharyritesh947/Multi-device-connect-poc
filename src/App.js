import React, { useState } from 'react';

function App() {
    const [drivers, setDrivers] = useState([]); // Store driver IDs and configurations
    const [log, setLog] = useState([]);

    const createDriver = async (config) => {
        try {
            console.log(`${config.port} -- Starts creating the driver --`);
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('create-driver', config);
            setDrivers((prevDrivers) => [...prevDrivers, { id: prevDrivers.length, config }]);
            setLog((prevLogs) => [...prevLogs, message]);
            console.log(`${config.port} -- Ending the creating the driver --`, drivers);
        } catch (error) {
            setLog((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
        }
    };

    const executeActions = async (driverId, actions) => {
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('execute-actions', { driverId, actions });
            setLog((prevLogs) => [...prevLogs, message]);
        } catch (error) {
            setLog((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
        }
    };

    const stopDriver = async (driverId) => {
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('stop-driver', driverId);
            setDrivers((prevDrivers) => prevDrivers.filter((driver) => driver.id !== driverId));
            setLog((prevLogs) => [...prevLogs, message]);
        } catch (error) {
            setLog((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
        }
    };

    const stopAllDrivers = async () => {
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('stop-all-drivers');
            setDrivers([]);
            setLog((prevLogs) => [...prevLogs, message]);
        } catch (error) {
            setLog((prevLogs) => [...prevLogs, `Error: ${error.message}`]);
        }
    };

    const startDriversParallely = async () => {
        const driversConfig = [
            {
                port: 4723,
                platformName: 'Android',
                deviceName: 'Redmi 9',
                platformVersion: '10',
                udid: 'EE6HQWAQ4X7XQG7L',
                app: 'D:\\APIDemos.apk',
                automationName: 'UiAutomator2',
            },
            {
                port: 4724,
                platformName: 'Android',
                deviceName: 'Redmi 6',
                platformVersion: '10',
                udid: 'de47d8917d29',
                app: 'D:\\APIDemos.apk',
                automationName: 'UiAutomator2',
            },
        ];

        await Promise.all(driversConfig.map((config) => createDriver(config)));
    };

    const executeDevicesParallely = async () => {
        await Promise.all(
            drivers.map((driver) =>
                executeActions(driver.id, [
                    { type: 'action', action: 'click', xpath: '//android.widget.TextView[@content-desc="Animation"]' },
                    { type: 'sleep', value: 1000 },
                    { type: 'action', action: 'click', xpath: '//android.widget.TextView[@content-desc="Cloning"]' },
                ])
            )
        );
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Mobile Automation POC</h1>

            <button
                onClick={() =>
                    createDriver({
                        port: 4723,
                        platformName: 'Android',
                        deviceName: 'Redmi 9',
                        platformVersion: '10',
                        udid: 'EE6HQWAQ4X7XQG7L',
                        app: 'D:\\APIDemos.apk',
                        automationName: 'UiAutomator2',
                    })
                }
            >
                Create Driver for Redmi 9
            </button>

            <button
                onClick={() =>
                    createDriver({
                        port: 4724,
                        platformName: 'Android',
                        deviceName: 'Redmi 6',
                        platformVersion: '10',
                        udid: 'de47d8917d29',
                        app: 'D:\\APIDemos.apk',
                        automationName: 'UiAutomator2',
                    })
                }
            >
                Create Driver for Redmi 6
            </button>

            <button onClick={startDriversParallely}>Start All Drivers</button>
            <button onClick={executeDevicesParallely}>Parallel Executions :)</button>

            <button onClick={stopAllDrivers}>Stop All Drivers</button>

            <ul>
                {drivers.map((driver) => (
                    <li key={driver.id}>
                        <span>
                            Driver {driver.id} - {driver.config.deviceName}
                        </span>
                        <button
                            onClick={() =>
                                executeActions(driver.id, [
                                    {
                                        type: 'action',
                                        action: 'click',
                                        xpath: '//android.widget.TextView[@content-desc="Animation"]',
                                    },
                                    { type: 'sleep', value: 1000 },
                                    {
                                        type: 'action',
                                        action: 'click',
                                        xpath: '//android.widget.TextView[@content-desc="Cloning"]',
                                    },
                                ])
                            }
                        >
                            Execute Actions
                        </button>
                        <button onClick={() => stopDriver(driver.id)}>Stop Driver</button>
                    </li>
                ))}
            </ul>

            <div>
                <h3>Logs:</h3>
                <ul>
                    {log.map((entry, index) => (
                        <li key={index}>{entry}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default App;
