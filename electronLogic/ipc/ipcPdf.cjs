const { app, ipcMain, dialog, BrowserWindow } = require("electron");
const fs = require("fs");
const path = require("path");


function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
        console.error("[ipcPdf] ensureDir error:", dirPath, err);
        throw err;
    }
}
function readText(filePath) {
    return fs.readFileSync(filePath, "utf8");
}
function readBinary(filePath) {
    return fs.readFileSync(filePath);
}

function writeFileAtomic(targetPath, buffer) {
    const dir = path.dirname(targetPath);
    ensureDir(dir);
    const tmp = path.join(dir, `.${path.basename(targetPath)}.tmp`);
    fs.writeFileSync(tmp, buffer);
    fs.renameSync(tmp, targetPath);
}
function safe(v) {
    return v == null ? "" : String(v);
}
function safeMoney(n) {
    const num = Number(n);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
}
function safeHours(h) {
    const n = Number(h);
    if (!Number.isFinite(n)) return "0.0 h";
    const str = (Math.round(n * 100) / 100).toString();
    return `${str} h`;
}


function safeNumber2(n) {
    const num = Number(n);
    if (!Number.isFinite(num)) return "";
    const rounded = Math.round(num * 100) / 100;
    return String(rounded);
}


function resolveLogoPath() {
    const candidates = [];

    if (!app.isPackaged) {
        candidates.push(path.join(app.getAppPath(), "src", "assets", "logo_carrozzeria.png"));
    } else {
        candidates.push(path.join(process.resourcesPath, "assets", "logo_carrozzeria.png"));
        candidates.push(path.join(process.resourcesPath, "app.asar.unpacked", "assets", "logo_carrozzeria.png"));
    }

    for (const p of candidates) {
        if (p && fs.existsSync(p)) {
            console.log("[ipcPdf] Using logo:", p);
            return p;
        }
    }

    console.warn("[ipcPdf] No logo found. Tried:", candidates);
    return null;
}





ipcMain.handle("quotes:choose-pdf-save-path", async (_event, defaultName) => {
    try {
        let defaultPath = "quote.pdf";

        if (typeof defaultName === "string" && defaultName.trim()) {
            const trimmed = defaultName.trim();


            const looksLikePath =
                trimmed.includes(path.sep) || trimmed.includes("/") || trimmed.includes("\\");

            if (looksLikePath) {
                const dir = path.dirname(trimmed);
                const base = path.basename(trimmed);
                const nameWithoutExt = base.replace(/\.[^/.]+$/, "");
                const pdfName = `${nameWithoutExt || base}.pdf`;
                defaultPath = path.join(dir, pdfName);
            } else {
                const nameWithoutExt = trimmed.replace(/\.[^/.]+$/, "");
                defaultPath = `${nameWithoutExt || trimmed}.pdf`;
            }
        }

        const result = await dialog.showSaveDialog({
            title: "Save Quote as PDF",
            defaultPath,
            filters: [{ name: "PDF", extensions: ["pdf"] }],
        });

        if (result.canceled) {
            console.log("[ipcPdf] Save dialog canceled");
            return { ok: false, canceled: true };
        }
        console.log("[ipcPdf] Save dialog path:", result.filePath);
        return { ok: true, path: result.filePath };
    } catch (err) {
        console.error("[ipcPdf] choose-pdf-save-path error:", err);
        return { ok: false, error: err.message || String(err) };
    }
});




ipcMain.handle("quotes:export-to-pdf", async (_event, { targetPath, data, anonymize }) => {
    let win;
    console.time("[ipcPdf] export-to-pdf");
    try {
        console.log("[ipcPdf] START export-to-pdf, anonymize:", !!anonymize);
        if (!targetPath) throw new Error("targetPath is required");
        if (!data || typeof data !== "object") {
            throw new Error("data is required and must be an object");
        }


        const templatePath = path.join(__dirname, "..", "pdfTemplate", "pdfTemplate.html");
        const cssPath = path.join(__dirname, "..", "pdfTemplate", "pdfTemplate.css");


        const logoPath = resolveLogoPath();

        console.log("[ipcPdf] templatePath:", templatePath);
        console.log("[ipcPdf] cssPath:", cssPath);

        let htmlContent = readText(templatePath);
        const cssContent = readText(cssPath);


        const linkRegex = /<link[^>]+href=["']file:\/\/\{\{cssPath\}\}["'][^>]*>\s*/i;
        if (linkRegex.test(htmlContent)) {
            htmlContent = htmlContent.replace(linkRegex, `<style>\n${cssContent}\n</style>\n`);
        } else {
            htmlContent = htmlContent.replace(
                /<\/head>/i,
                `<style>\n${cssContent}\n</style>\n</head>`
            );
        }


        let logoDataUrl = "";
        if (logoPath) {
            try {
                const buf = readBinary(logoPath);
                const b64 = buf.toString("base64");
                logoDataUrl = `data:image/png;base64,${b64}`;
            } catch (e) {
                console.warn("[ipcPdf] logo load failed:", e?.message || e);
            }
        }
        htmlContent = htmlContent.replace(/\{\{logoDataUrl\}\}/g, safe(logoDataUrl));


        const g = data.general || data.quote || {};
        const items = Array.isArray(data.items) ? data.items : [];
        const comp = data.complementary || {};
        const totals = data.totals || {};

        htmlContent = htmlContent
            .replace(/\{\{client\}\}/g, safe(g.client))
            .replace(/\{\{licensePlate\}\}/g, safe(g.licensePlate))
            .replace(/\{\{model\}\}/g, safe(g.model))
            .replace(/\{\{year\}\}/g, safe(g.year))
            .replace(/\{\{chassis\}\}/g, safe(g.chassis))
            .replace(/\{\{insurance\}\}/g, safe(g.insurance))
            .replace(/\{\{quoteDate\}\}/g, safe(g.quoteDate));


        let itemsHtml = "";
        for (const it of items) {
            itemsHtml += `
        <tr>
          <td>${safe(it?.source ?? "—")}</td>
          <td>${safe(it?.description ?? "—")}</td>
          <td>${safe(it?.SR ?? 0)}</td>
          <td>${safe(it?.LA ?? 0)}</td>
          <td>${safe(it?.VE ?? 0)}</td>
          <td>${safe(it?.ME ?? 0)}</td>
          <td>${safe(it?.quantity ?? 0)}</td>
          <td>€${safeMoney(it?.price ?? 0)}</td>
          <td>€${safeMoney(it?.total ?? 0)}</td>
        </tr>`;
        }
        htmlContent = htmlContent.replace(/\{\{items\}\}/g, itemsHtml);


        function fillComplementaryRow(prefix, obj) {
            let quantity = "";
            let price = "";
            let tax = "";
            let total = "";
            let taxable = "";
            let taxAmount = "";
            let totalWithTax = "";

            if (obj && typeof obj === "object") {
                quantity = safeNumber2(obj.quantity);
                price = safeMoney(obj.price);
                tax = safeNumber2(obj.tax);
                total = safeMoney(obj.total);
                taxable = safeMoney(obj.taxable);
                taxAmount = safeMoney(obj.taxAmount);
                totalWithTax = safeMoney(obj.totalWithTax);
            }

            const map = {
                quantity,
                price,
                tax,
                total,
                taxable,
                taxAmount,
                totalWithTax,
            };

            for (const [key, value] of Object.entries(map)) {
                const re = new RegExp(`\\{\\{${prefix}_${key}\\}\\}`, "g");
                htmlContent = htmlContent.replace(re, safe(value));
            }
        }


        fillComplementaryRow("partsTotal", comp.partsTotal);
        fillComplementaryRow("parts", comp.parts);
        fillComplementaryRow("bodywork", comp.bodywork);
        fillComplementaryRow("mechanics", comp.mechanics);
        fillComplementaryRow("consumables", comp.consumables);


        htmlContent = htmlContent
            .replace(/\{\{subtotal\}\}/g, safeMoney(totals.subtotal))
            .replace(/\{\{iva\}\}/g, safeMoney(totals.iva))
            .replace(/\{\{totalWithIva\}\}/g, safeMoney(totals.totalWithIva));


        if (anonymize) {
            htmlContent = htmlContent
                .replace(/\s*<div class="identity">[\s\S]*?<\/div>/i, "")
                .replace(/\s*<div class="brand">[\s\S]*?<\/div>/i, "");
            htmlContent = htmlContent.replace(
                /<div class="page-hint">[\s\S]*?<\/div>/i,
                '<div class="page-hint">Preventivo</div>'
            );
        }



        win = new BrowserWindow({
            show: false,
            webPreferences: { nodeIntegration: false, contextIsolation: true },
        });


        const loadTimeoutMs = 15000;
        const printTimeoutMs = 20000;

        const once = (emitter, event) => new Promise((resolve) => emitter.once(event, resolve));

        let loadTimer;
        const loadWatchdog = new Promise((_, reject) => {
            loadTimer = setTimeout(() => {
                reject(new Error(`Timeout waiting for did-finish-load after ${loadTimeoutMs}ms`));
            }, loadTimeoutMs);
        });

        const failLoadPromise = new Promise((_, reject) => {
            win.webContents.once("did-fail-load", (_e, code, desc, url) => {
                reject(new Error(`did-fail-load ${code}: ${desc} @ ${url}`));
            });
        });

        const crashedPromise = new Promise((_, reject) => {
            win.webContents.once("crashed", () => reject(new Error("webContents crashed")));
            win.once("unresponsive", () => reject(new Error("BrowserWindow unresponsive")));
            win.webContents.once("render-process-gone", (_e, details) => {
                reject(new Error(`render-process-gone: ${details?.reason || "unknown"}`));
            });
        });

        const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
        console.log("[ipcPdf] loadURL(data:...)");
        const navPromise = win.loadURL(dataUrl).catch((err) => {
            throw new Error(`loadURL error: ${err?.message || String(err)}`);
        });

        await Promise.race([
            once(win.webContents, "did-finish-load"),
            failLoadPromise,
            crashedPromise,
            loadWatchdog,
            navPromise,
        ]);
        clearTimeout(loadTimer);
        console.log("[ipcPdf] did-finish-load");


        try {
            await win.webContents.executeJavaScript(
                `(async () => { try { if (document.fonts && document.fonts.ready) { await document.fonts.ready; } } catch(e){} return true; })();`,
                true
            );
        } catch { }


        let printTimer;
        const printWatchdog = new Promise((_, reject) => {
            printTimer = setTimeout(() => {
                reject(new Error(`Timeout waiting for printToPDF after ${printTimeoutMs}ms`));
            }, printTimeoutMs);
        });

        console.log("[ipcPdf] printToPDF start");
        const pdfBufferPromise = win.webContents.printToPDF({
            printBackground: true,
            pageSize: "A4",
            marginsType: 0,
            landscape: false,
        });

        const pdfBuffer = await Promise.race([pdfBufferPromise, printWatchdog]);
        clearTimeout(printTimer);

        const byteLen = Buffer.isBuffer(pdfBuffer) ? pdfBuffer.length : pdfBuffer?.byteLength || 0;
        if (!pdfBuffer || byteLen === 0) throw new Error("printToPDF returned an empty buffer");


        writeFileAtomic(
            targetPath,
            Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)
        );
        console.timeEnd("[ipcPdf] export-to-pdf");
        return { ok: true, path: targetPath, bytes: byteLen };
    } catch (err) {
        console.timeEnd("[ipcPdf] export-to-pdf");
        console.error("[ipcPdf] export-to-pdf error:", err);
        return { ok: false, error: err.message || String(err) };
    } finally {
        if (win && !win.isDestroyed()) {
            win.close();
            console.log("[ipcPdf] window closed");
        }
    }
});
