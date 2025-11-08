const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');

// Directory for quotes
const quotesDir = path.join(app.getPath('documents'), 'preventivi-officina');
if (!fs.existsSync(quotesDir)) fs.mkdirSync(quotesDir, { recursive: true });

// --- List all quotes ---
ipcMain.handle('list-quotes', async () => {
    try {
        const files = fs.readdirSync(quotesDir).filter(f => f.endsWith('.json'));
        const quotes = files.map(f => {
            const filePath = path.join(quotesDir, f);
            const content = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(content);
            data._fileName = f; // include filename for reference/editing
            return data;
        });
        return { ok: true, quotes };
    } catch (err) {
        return { ok: false, error: `Failed to list quotes: ${err.message}` };
    }
});

// --- Save a quote ---
ipcMain.handle('save-quote', async (_event, { filename, data }) => {
    try {
        if (!filename || !data) throw new Error('Filename and data are required');
        const filePath = path.join(quotesDir, filename.endsWith('.json') ? filename : filename + '.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return { ok: true, path: filePath };
    } catch (err) {
        return { ok: false, error: `Failed to save quote: ${err.message}` };
    }
});

// --- Read a single quote ---
ipcMain.handle('read-quote', async (_event, fileName) => {
    try {
        if (!fileName) throw new Error('File name is required');
        const filePath = path.join(quotesDir, fileName);
        if (!fs.existsSync(filePath)) return { ok: false, error: 'File not found' };
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        return { ok: true, data };
    } catch (err) {
        return { ok: false, error: `Failed to read quote: ${err.message}` };
    }
});

// --- Delete a quote ---
ipcMain.handle('delete-quote', async (_event, fileName) => {
    try {
        if (!fileName) throw new Error('File name is required');
        const filePath = path.join(quotesDir, fileName);
        if (!fs.existsSync(filePath)) return { ok: false, error: 'File not found' };
        fs.unlinkSync(filePath);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: `Failed to delete quote: ${err.message}` };
    }
});

// --- Auto-save quote (new) ---
ipcMain.handle('export-json-auto', async (_event, { filename, data }) => {
    try {
        if (!filename || !data) throw new Error('Filename and data are required');
        const targetPath = path.join(quotesDir, filename.endsWith('.json') ? filename : filename + '.json');
        fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf8');
        return { ok: true, path: targetPath };
    } catch (err) {
        return { ok: false, error: `Failed to auto-save quote: ${err.message}` };
    }
});
