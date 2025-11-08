// ipc/ipcQuotes.js
const { ipcMain, app } = require('electron');
const fs = require('fs');
const path = require('path');

// Directory dei preventivi
const quotesDir = path.join(app.getPath('documents'), 'preventivi-officina');
if (!fs.existsSync(quotesDir)) fs.mkdirSync(quotesDir, { recursive: true });

// List all quotes
ipcMain.handle('list-quotes', async () => {
    try {
        const files = fs.readdirSync(quotesDir).filter(f => f.endsWith('.json'));
        const quotes = files.map(f => {
            const content = fs.readFileSync(path.join(quotesDir, f), 'utf8');
            return JSON.parse(content);
        });
        return { ok: true, quotes };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

// Save a quote in the directory
ipcMain.handle('save-quote', async (_event, { filename, data }) => {
    try {
        const filePath = path.join(quotesDir, filename + '.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        return { ok: true, path: filePath };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});