// ipc/ipcJson.js
const { ipcMain, dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');

// --- JSON Export Handlers ---
ipcMain.handle('export-json', async (_event, data) => {
    try {
        const target = path.join(app.getPath('documents'), 'preventivo.json');
        fs.writeFileSync(target, JSON.stringify(data, null, 2), 'utf8');
        return { ok: true, path: target };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

ipcMain.handle('choose-save-path', async (_event, defaultName) => {
    const result = await dialog.showSaveDialog({
        title: 'Save Preventivo',
        defaultPath: defaultName,
        filters: [{ name: 'Preventivo JSON', extensions: ['json'] }]
    });
    return result.canceled ? { ok: false, canceled: true } : { ok: true, path: result.filePath };
});

ipcMain.handle('export-json-at-path', async (_event, { path, data }) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
        return { ok: true };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});