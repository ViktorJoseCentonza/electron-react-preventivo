const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts } = require("pdf-lib");

// Ensure directory exists
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
        console.error("Failed to ensure directory:", dirPath, err);
        throw err;
    }
}

// Create PDF from the quote data
async function createPdfFromQuote(quoteData) {
    if (!quoteData || typeof quoteData !== "object") {
        throw new Error("Invalid quoteData: not an object");
    }

    const { general, items, complementary, totals } = quoteData;
    if (!general || !items || !complementary || !totals) {
        throw new Error("Invalid quoteData structure: missing general/items/complementary/totals");
    }

    // Create PDF document and page
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size approx
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica); // Standard font
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); // Bold font for headers
    const fontSize = 10;
    const headerFontSize = 12;
    const boldHeaderFontSize = 14;
    const marginLeft = 50;
    const columnWidth = 90; // Width for each column in the table
    const headerColumnWidth = 120; // Wider header columns
    const rowHeight = 20; // Height for each row in the table

    let y = 800;

    // Client Information Section (matching HTML form layout with border cells)
    page.drawText("Cliente", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.client, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 20;

    page.drawText("Targa", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.licensePlate, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 20;

    page.drawText("Modello", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.model, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 20;

    page.drawText("Anno", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.year, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 20;

    page.drawText("Telaio", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.chassis, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 20;

    page.drawText("Assicurazione", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.insurance, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 20;

    page.drawText("Data Preventivo", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(general.quoteDate, { x: marginLeft + 100, y, size: fontSize, font });
    y -= 40;

    // Items Table Header (citazione fonte, descrizione, etc.)
    page.drawText("Items", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;

    const headers = ["Citaz. fonte", "Descrizione", "SR", "LA", "VE", "ME", "Q.tà", "Prezzo", "Totale"];
    headers.forEach((header, index) => {
        page.drawText(header, { x: marginLeft + (index * headerColumnWidth), y, size: headerFontSize, font: boldFont });
    });

    // Draw Border below header
    y -= 20; // Move down to next row
    page.drawLine({ start: { x: marginLeft, y }, end: { x: marginLeft + (headers.length * headerColumnWidth), y }, thickness: 1 });

    y -= 10; // Space between header and first row

    // Draw Table Rows for each item (using items data)
    items.forEach((item) => {
        const row = [
            item.source || "N/A",
            item.description || "N/A",
            item.SR || 0,
            item.LA || 0,
            item.VE || 0,
            item.ME || 0,
            item.quantity || 0,
            item.price || 0,
            item.total || 0
        ];

        row.forEach((cell, index) => {
            page.drawText(String(cell), { x: marginLeft + (index * columnWidth), y, size: fontSize, font });
        });

        y -= rowHeight; // Move down to the next row after each item

        // Draw Border for each row
        page.drawLine({ start: { x: marginLeft, y }, end: { x: marginLeft + (headers.length * columnWidth), y }, thickness: 1 });
    });

    y -= 20; // Space between table and next section

    // Complementary Charges Section
    page.drawText("Voci complementari", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;

    Object.keys(complementary).forEach(key => {
        const part = complementary[key];
        page.drawText(`${key.charAt(0).toUpperCase() + key.slice(1)}:`, { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
        y -= 20;
        page.drawText(`Q.tà: ${part.quantity} Prezzo: €${part.price} Totale: €${part.totalWithTax}`, { x: marginLeft + 100, y, size: fontSize, font });
        y -= 20;
    });

    // Totals Section (with proper formatting and spacing)
    y -= 20; // Space between sections
    page.drawText("Totale senza IVA", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(`€ ${totals.subtotal.toFixed(2)}`, { x: marginLeft + 100, y, size: fontSize, font });

    y -= 20;
    page.drawText("Totale IVA", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(`€ ${totals.iva.toFixed(2)}`, { x: marginLeft + 100, y, size: fontSize, font });

    y -= 20;
    page.drawText("Totale IVA inclusa", { x: marginLeft, y, size: boldHeaderFontSize, font: boldFont });
    y -= 20;
    page.drawText(`€ ${totals.totalWithIva.toFixed(2)}`, { x: marginLeft + 100, y, size: fontSize, font });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}

// IPC handler to export to PDF
ipcMain.handle("quotes:export-to-pdf", async (_event, { targetPath, data }) => {
    try {
        console.log("Exporting PDF to path:", targetPath);
        console.log("Received data:", data);

        if (!targetPath) {
            throw new Error("targetPath is required");
        }

        const pdfBytes = await createPdfFromQuote(data);

        // Ensure the target directory exists
        const dir = path.dirname(targetPath);
        ensureDir(dir);

        // Write the PDF to the target path
        fs.writeFileSync(targetPath, pdfBytes);

        return { ok: true };
    } catch (err) {
        console.error("Error exporting PDF:", err);
        return { ok: false, error: err.message || String(err) };
    }
});

// IPC handler to choose save path
ipcMain.handle("quotes:choose-pdf-save-path", async (_event, defaultName) => {
    try {
        const defaultFilename = typeof defaultName === "string" ? defaultName : "quote.pdf";

        const result = await dialog.showSaveDialog({
            title: "Save Quote as PDF",
            defaultPath: defaultFilename,
            filters: [{ name: "PDF", extensions: ["pdf"] }],
        });

        console.log("Save dialog result:", result);

        if (result.canceled) {
            return { ok: false, canceled: true };
        } else {
            return { ok: true, path: result.filePath };
        }
    } catch (err) {
        console.error("Error in choose-pdf-save-path:", err);
        return { ok: false, error: err.message || String(err) };
    }
});
