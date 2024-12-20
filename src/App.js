import React, { useState } from 'react';

function App() {
    const [drivers, setDrivers] = useState([]); // Store driver IDs and configurations
    const [log, setLog] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    const createDriver = async (config) => {
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('create-driver', config);
            const driverId = drivers.length; // Use the index as ID
            setDrivers([...drivers, { id: driverId, config }]);
            setLog([...log, message]);
        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        }
    };
/* Check for device-2  */
    const executeActions = async (driverId, actions) => {
        try {
            //need to create parallel thread somewhere here @Ameer
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('execute-actions', { driverId, actions });
            setLog([...log, message]);
        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        }
    };

    const stopDriver = async (driverId) => {
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('stop-driver', driverId);
            setDrivers(drivers.filter(driver => driver.id !== driverId));
            setLog([...log, message]);
        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        }
    };

    const stopAllDrivers = async () => {
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('stop-all-drivers');
            setDrivers([]);
            setLog([...log, message]);
        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Mobile Automation POC</h1>

            <button onClick={() => createDriver({
                port: 4723,
                platformName: 'Android',
                deviceName: 'Redmi 9',
                platformVersion: '10',
                udid: 'EE6HQWAQ4X7XQG7L',
                app: 'D:\\APIDemos.apk',
                automationName: 'UiAutomator2',
            })}>Create Driver for Redmi 9</button>

             <button onClick={() => createDriver({
                port: 4724,
                platformName: 'Android',
                'appium:deviceName': 'Redmi 6',
                'appium:platformVersion': '10',
                'appium:udid': 'de47d8917d29',
                'appium:app': 'D:\\APIDemos.apk',
                'appium:automationName': 'UiAutomator2',
            })}>Create Driver for Redmi 6</button>
            
            <button onClick={stopAllDrivers}>Stop All Drivers</button>

            <ul>
                {drivers.map((driver, index) => (
                    <li key={index}>
                        <span>Driver {driver.id} - {driver.config.deviceName}</span>
                        <button onClick={() => executeActions(driver.id, [
                            { type: 'action', action: 'click', xpath: '//android.widget.TextView[@content-desc="Animation"]' },
                            { type: 'sleep', value: 1000 },
                            { type: 'action', action: 'click', xpath: '//android.widget.TextView[@content-desc="Cloning"]' },
                        ])}>Execute Actions</button>
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
