// ipc/ipcPdf.js
const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const PDFDocument = require('pdfkit');

// --- PDF Export Handlers ---
ipcMain.handle('choose-save-pdf', async () => {
    const result = await dialog.showSaveDialog({
        title: 'Save Preventivo as PDF',
        defaultPath: 'preventivo.pdf',
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    });
    return result.canceled ? { ok: false, canceled: true } : { ok: true, path: result.filePath };
});

ipcMain.handle('export-pdf-at-path', async (_event, { path, data }) => {
    try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(path);
        doc.pipe(stream);

        // Title
        doc.fontSize(20).text('Preventivo', { align: 'center' });
        doc.moveDown();

        // Client info
        doc.fontSize(12).text(`Cliente: ${data.client}`);
        doc.text(`Data: ${data.date}`);
        doc.moveDown();

        // Table header
        doc.fontSize(12).text('Descrizione', 50, doc.y);
        doc.text('Qtà', 300, doc.y, { width: 40 });
        doc.text('Prezzo', 350, doc.y, { width: 80 });
        doc.text('Totale', 450, doc.y, { width: 80 });
        doc.moveDown();

        // Table items
        data.items.forEach(item => {
            doc.text(item.description, 50, doc.y);
            doc.text(String(item.qty), 300, doc.y, { width: 40 });
            doc.text(item.price.toFixed(2) + ' €', 350, doc.y, { width: 80 });
            doc.text(item.total.toFixed(2) + ' €', 450, doc.y, { width: 80 });
            doc.moveDown();
        });

        // Totals
        doc.moveDown();
        doc.fontSize(14).text(`Totale: ${data.totale.toFixed(2)} €`, { align: 'right' });

        doc.end();
        await new Promise(resolve => stream.on('finish', resolve));

        return { ok: true };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});