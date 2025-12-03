
const { app, BrowserWindow } = require('electron');
const path = require('path');


require('./ipc/ipcJson.cjs');
require('./ipc/ipcPdf.cjs');

function createWindow() {
    const win = new BrowserWindow({
        show: false,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadURL('http://localhost:5173');

    win.once('ready-to-show', () => {
        win.maximize();
        win.show();
    });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
