const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { PDFDocument, StandardFonts } = require("pdf-lib");

// Ensure directory exists (helper function)
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
        console.error("Failed to ensure directory:", dirPath, err);
        throw err;
    }
}

// Create a PDF from quote data
async function createPdfFromQuote(quoteData) {
    if (!quoteData || typeof quoteData !== "object") {
        throw new Error("Invalid quoteData: not an object");
    }

    const { general, items, totals } = quoteData;
    if (!general || !items || !totals) {
        throw new Error("Invalid quoteData structure: missing general/items/totals");
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size

    // Embed a standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);  // Correct usage of font
    const fontSize = 12;

    let y = 800;
    const marginLeft = 50;

    // Add text to the PDF (client details)
    page.drawText(`Client: ${general.client || "N/A"}`, { x: marginLeft, y, size: fontSize, font });
    y -= 20;
    page.drawText(`License Plate: ${general.licensePlate || "N/A"}`, { x: marginLeft, y, size: fontSize, font });
    y -= 20;
    page.drawText(`Model: ${general.model || "N/A"}`, { x: marginLeft, y, size: fontSize, font });
    y -= 20;
    page.drawText(`Year: ${general.year || "N/A"}`, { x: marginLeft, y, size: fontSize, font });
    y -= 20;
    page.drawText(`Quote Date: ${general.quoteDate || "N/A"}`, { x: marginLeft, y, size: fontSize, font });
    y -= 40;

    // Add items to the PDF
    page.drawText("Items:", { x: marginLeft, y, size: fontSize, font });
    y -= 20;

    items.forEach((item, idx) => {
        const desc = item.description || "N/A";
        page.drawText(`Item ${idx + 1}: ${desc}`, { x: marginLeft, y, size: fontSize, font });
        y -= 20;
    });

    // Add total to the PDF
    y -= 20;
    page.drawText(`Total: ${totals.totalWithIva ?? "N/A"}`, { x: marginLeft, y, size: fontSize, font });

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
