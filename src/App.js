import React, { useState } from 'react';

function App() {
    const [log, setLog] = useState([]);
    const [isRunning, setIsRunning] = useState(false);

    const runParallelTests = async () => {
        setIsRunning(true);
        try {
            const { ipcRenderer } = window.electron;
            const results = await ipcRenderer.invoke('run-parallel-tests');
            setLog([...log, ...results]);
        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        } finally {
            setIsRunning(false);
        }
    };

    const stopSessions = async () => {
        setIsRunning(true);
        try {
            const { ipcRenderer } = window.electron;
            const message = await ipcRenderer.invoke('stop-sessions');
            setLog([...log, message]);
        } catch (error) {
            setLog([...log, `Error: ${error.message}`]);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Mobile Automation POC</h1>
            <button onClick={runParallelTests} disabled={isRunning}>Run Parallel Tests</button>
            <button onClick={stopSessions} disabled={isRunning}>Stop Sessions</button>
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
