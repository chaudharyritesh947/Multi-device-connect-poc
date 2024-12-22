import React, { useEffect, useState } from 'react';

function App() {
    const [drivers, setDrivers] = useState([]); // Store driver IDs and configurations
    const [log, setLog] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(()=>{
        console.log(drivers);
        console.log(log);
    }, [drivers]);

    const createDriver = async (config) => {
        try {
            //check ki ye kaise kaam karega!
            console.log(config.port, "--Starts creating the driver--");
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('create-driver', config);
            const driverId = drivers.length; // Use the index as ID
            setDrivers((prevDrivers) => [...prevDrivers, { id: prevDrivers.length, config }]);
            setLog((prevLogs) => [...prevLogs, message]);

            console.log(config.port, "--Ending the creating the driver--", drivers);

        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        }
    };
/* Check for device-2  */
    const executeActions = async (driverId, actions) => {
        try {
            //need to create parallel thread somewhere here @Ameer
            const { ipcRenderer } = window.electron;
            //Revert
            // const message = await ipcRenderer.invoke('execute-actions', { driverId, actions });
            // const message = await ipcRenderer.invoke('execute-actions', { driverId, actions });
            // setLog([...log, message]);

            return await ipcRenderer.invoke('execute-actions', { driverId, actions });
           
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

    const startDriversParalley = async () => {
        const drivers_ = [{
            port: 4723,
            platformName: 'Android',
            deviceName: 'Redmi 9',
            platformVersion: '10',
            udid: 'EE6HQWAQ4X7XQG7L',
            app: 'D:\\APIDemos.apk',
            automationName: 'UiAutomator2',
        },{
            port: 4724,
            platformName: 'Android',
            deviceName: 'Redmi 6',
            platformVersion: '10',
            udid: 'de47d8917d29',
            app: 'D:\\APIDemos.apk',
            automationName: 'UiAutomator2',
        }];

      const drivers__ = await Promise.all(
            drivers_.map((driver_) => createDriver(driver_))
            );
    }

    const executeDevicesParalley = async () => {
        const driversExecution = await Promise.all(
            drivers.map((driver) => executeActions(driver.id, [  
                { type: 'action', action: 'click', xpath: '//android.widget.TextView[@content-desc="Animation"]' },
                { type: 'sleep', value: 1000 },
                { type: 'action', action: 'click', xpath: '//android.widget.TextView[@content-desc="Cloning"]' }]))
            );
        setLog([...log, driversExecution]);
    }
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
                deviceName: 'Redmi 6',
                platformVersion: '10',
                udid: 'de47d8917d29',
                app: 'D:\\APIDemos.apk',
                automationName: 'UiAutomator2',
            })}>Create Driver for Redmi 6</button>

            <button onClick={startDriversParalley}>Start All Drivers</button>
            <button onClick={executeDevicesParalley}>Parallel Executions :\)</button>

            

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
