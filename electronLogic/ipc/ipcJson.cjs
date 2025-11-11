const { ipcMain, dialog, app } = require("electron");
const fs = require("fs");
const path = require("path");

// ----------------------------
// CONSTANTS & DIRECTORIES
// ----------------------------
const APP_DIR_NAME = "preventivi-officina";
const jsonDir = path.join(app.getPath("documents"), APP_DIR_NAME);

// Ensure base dir exists
ensureDir(jsonDir);

// ----------------------------
// UTILITIES
// ----------------------------
function ensureDir(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
        console.error("[ipcJson] Failed to ensure directory:", dirPath, err);
        throw err;
    }
}

function sanitizeFilename(name) {
    if (!name || typeof name !== "string") return "";
    // Keep letters, numbers, spaces, dashes, underscores, dots (for .json)
    const cleaned = name
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/^\.+$/, "") // avoid "." or ".."
        .slice(0, 200);
    return cleaned || "preventivo";
}

function withJsonExtension(filename) {
    return filename.endsWith(".json") ? filename : `${filename}.json`;
}

/** Atomic write: write to temp file then rename */
function writeJSONAtomic(filePath, dataObj) {
    if (!filePath) throw new Error("filePath required");
    const dir = path.dirname(filePath);
    ensureDir(dir);
    const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp`);

    const payload = JSON.stringify(dataObj, null, 2);

    fs.writeFileSync(tmpPath, payload, { encoding: "utf8" });
    // fsync via rename boundary for most platforms
    fs.renameSync(tmpPath, filePath);
}

function readJSONSafe(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
}

/** Return array of ".json" files in jsonDir */
function listJsonFiles() {
    if (!fs.existsSync(jsonDir)) return [];
    return fs
        .readdirSync(jsonDir, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".json"))
        .map((d) => d.name);
}

/** Project-level "schema" normalizer (lenient):
 * Accept both legacy flat and new structured formats; return a normalized object
 * so search and preview remain resilient.
 */
function normalizeQuoteForSearch(raw) {
    if (!raw || typeof raw !== "object") return { general: {}, items: [], complementary: {}, totals: {} };

    // Newer structure (contexts/QuoteDataContext default)
    const general =
        raw.general ||
        {
            client: raw.client,
            licensePlate: raw.licensePlate,
            model: raw.model,
            year: raw.year,
            chassis: raw.chassis,
            insurance: raw.insurance,
            quoteDate: raw.quoteDate,
        };

    const items = Array.isArray(raw.items) ? raw.items : raw.items?.items || [];

    const complementary =
        raw.complementary ||
        {
            parts: raw.parts,
            bodywork: raw.bodywork,
            mechanics: raw.mechanics,
            consumables: raw.consumables,
            partsTotal: raw.partsTotal,
        };

    const totals = raw.totals || raw.totalQuote || {};

    return { general: general || {}, items: items || [], complementary: complementary || {}, totals: totals || {} };
}

// ----------------------------
// IPC HANDLERS
// ----------------------------

/** Return base directory used for storing quotes */
ipcMain.handle("quotes:base-dir", async () => {
    try {
        ensureDir(jsonDir);
        return { ok: true, path: jsonDir };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

/** List all quotes. Returns lightweight preview data and filenames. */
ipcMain.handle("quotes:list", async () => {
    try {
        ensureDir(jsonDir);
        const files = listJsonFiles();

        const quotes = files.map((file) => {
            try {
                const data = readJSONSafe(path.join(jsonDir, file));
                const { general, totals } = normalizeQuoteForSearch(data);
                return {
                    file,
                    preview: {
                        client: general.client ?? null,
                        licensePlate: general.licensePlate ?? null,
                        model: general.model ?? null,
                        year: general.year ?? null,
                        insurance: general.insurance ?? null,
                        quoteDate: general.quoteDate ?? null,
                        totalWithIva: totals?.totalWithIva ?? null,
                    },
                    _fileName: file // Include the filename in the quote object
                };
            } catch (err) {
                console.warn("[ipcJson] Failed to parse file during list:", file, err);
                return { file, preview: null, parseError: true };
            }
        });

        return { ok: true, files, quotes };
    } catch (err) {
        return { ok: false, error: `Failed to list quotes: ${err.message}` };
    }
});

/** Read a single quote file by name (must exist in jsonDir) */
ipcMain.handle("quotes:read", async (_event, fileName) => {
    try {
        if (!fileName) throw new Error("fileName is required");
        const safe = withJsonExtension(sanitizeFilename(fileName));
        const filePath = path.join(jsonDir, safe);
        if (!fs.existsSync(filePath)) return { ok: false, error: "File not found" };
        const data = readJSONSafe(filePath);
        return { ok: true, data, _fileName: safe }; // Include the filename in the data object
    } catch (err) {
        return { ok: false, error: `Failed to read quote: ${err.message}` };
    }
});

/** Write/Save quote into jsonDir with given filename */
ipcMain.handle("quotes:write", async (_event, { filename, data }) => {
    try {
        if (!filename) throw new Error("filename is required");
        if (typeof data !== "object" || data == null) throw new Error("data must be an object");

        // Add the fileName to the quote data before saving
        const safe = withJsonExtension(sanitizeFilename(filename));
        data._fileName = safe; // Add _fileName field to the quote object

        const filePath = path.join(jsonDir, safe);
        writeJSONAtomic(filePath, data);
        return { ok: true, path: filePath };
    } catch (err) {
        return { ok: false, error: `Failed to save quote: ${err.message}` };
    }
});

/** Autosave helper (same as WRITE, separate channel for clarity/telemetry) */
ipcMain.handle("quotes:auto-save", async (_event, { filename, data }) => {
    try {
        if (!filename) throw new Error("filename is required");
        if (typeof data !== "object" || data == null) throw new Error("data must be an object");

        const safe = withJsonExtension(sanitizeFilename(filename));
        data._fileName = safe; // Add _fileName field to the quote object

        const filePath = path.join(jsonDir, safe);
        writeJSONAtomic(filePath, data);
        return { ok: true, path: filePath };
    } catch (err) {
        return { ok: false, error: `Failed to auto-save quote: ${err.message}` };
    }
});

/** Delete a quote by filename */
ipcMain.handle("quotes:delete", async (_event, fileName) => {
    try {
        if (!fileName) throw new Error("fileName is required");
        const safe = withJsonExtension(sanitizeFilename(fileName));
        const filePath = path.join(jsonDir, safe);
        if (!fs.existsSync(filePath)) return { ok: false, error: "File not found" };
        fs.unlinkSync(filePath);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: `Failed to delete quote: ${err.message}` };
    }
});

/** Check if a quote exists */
ipcMain.handle("quotes:exists", async (_event, fileName) => {
    try {
        if (!fileName) throw new Error("fileName is required");
        const safe = withJsonExtension(sanitizeFilename(fileName));
        const filePath = path.join(jsonDir, safe);
        return { ok: true, exists: fs.existsSync(filePath), path: filePath };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

/** Rename a quote (keeps it within jsonDir) */
ipcMain.handle("quotes:rename", async (_event, { oldName, newName }) => {
    try {
        if (!oldName || !newName) throw new Error("oldName and newName are required");
        const oldSafe = withJsonExtension(sanitizeFilename(oldName));
        const newSafe = withJsonExtension(sanitizeFilename(newName));
        const oldPath = path.join(jsonDir, oldSafe);
        const newPath = path.join(jsonDir, newSafe);
        if (!fs.existsSync(oldPath)) return { ok: false, error: "Source file not found" };
        if (fs.existsSync(newPath)) return { ok: false, error: "Target file already exists" };
        fs.renameSync(oldPath, newPath);
        return { ok: true, oldPath, newPath };
    } catch (err) {
        return { ok: false, error: `Failed to rename quote: ${err.message}` };
    }
});

/** Prompt user with Save Dialog to choose a path for exporting a JSON */
ipcMain.handle("quotes:choose-save-path", async (_event, defaultName) => {
    const defaultSafe = withJsonExtension(sanitizeFilename(defaultName || "preventivo"));
    const result = await dialog.showSaveDialog({
        title: "Salva Preventivo",
        defaultPath: defaultSafe,
        filters: [{ name: "Preventivo JSON", extensions: ["json"] }],
    });
    return result.canceled
        ? { ok: false, canceled: true }
        : { ok: true, path: result.filePath };
});

/** Export JSON content directly to a specified path (outside jsonDir) */
ipcMain.handle("quotes:export-to-path", async (_event, { targetPath, data }) => {
    try {
        if (!targetPath) throw new Error("targetPath is required");
        if (typeof data !== "object" || data == null) throw new Error("data must be an object");
        const dir = path.dirname(targetPath);
        ensureDir(dir);
        writeJSONAtomic(targetPath, data);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: String(err) };
    }
});

/** Search quotes by a free-text query across general fields and items
 * Returns ranked matches with a small preview payload.
 */
ipcMain.handle("quotes:search", async (_event, searchQuery) => {
    try {
        const q = String(searchQuery ?? "").trim().toLowerCase();
        if (!q) return { ok: true, matches: [] };

        const files = listJsonFiles();
        const matches = [];

        const generalFields = ["client", "licensePlate", "model", "year", "chassis", "insurance", "quoteDate"];

        const scoreHit = (scoreBag, key, weight = 1) => {
            scoreBag.total += weight;
            scoreBag.fields[key] = (scoreBag.fields[key] || 0) + weight;
        };

        files.forEach((file) => {
            const fullPath = path.join(jsonDir, file);
            try {
                const raw = readJSONSafe(fullPath);
                const normalized = normalizeQuoteForSearch(raw);
                const { general, items, totals } = normalized;

                const score = { total: 0, fields: {} };
                const matchedFields = [];

                generalFields.forEach((k) => {
                    const v = general[k];
                    if (v != null) {
                        const s = String(v).toLowerCase();
                        if (s.includes(q)) {
                            matchedFields.push(k);
                            scoreHit(score, k, 3); // general fields weighted higher
                        }
                    }
                });

                if (Array.isArray(items)) {
                    items.forEach((it, idx) => {
                        const desc = it?.description != null ? String(it.description).toLowerCase() : "";
                        const src = it?.source != null ? String(it.source).toLowerCase() : "";
                        if (desc.includes(q)) {
                            matchedFields.push(`items[${idx}].description`);
                            scoreHit(score, "items.description", 1);
                        }
                        if (src.includes(q)) {
                            matchedFields.push(`items[${idx}].source`);
                            scoreHit(score, "items.source", 1);
                        }
                    });
                }

                if (score.total > 0) {
                    matches.push({
                        file,
                        matchCount: score.total,
                        matchedFields,
                        preview: {
                            client: general.client ?? null,
                            licensePlate: general.licensePlate ?? null,
                            model: general.model ?? null,
                            year: general.year ?? null,
                            quoteDate: general.quoteDate ?? null,
                            totalWithIva: totals?.totalWithIva ?? null,
                        },
                    });
                }
            } catch (err) {
                console.warn("[ipcJson] Skipping unreadable file in search:", file, err);
            }
        });

        matches.sort((a, b) => (b.matchCount - a.matchCount) || a.file.localeCompare(b.file));

        return { ok: true, matches };
    } catch (err) {
        return { ok: false, error: `Failed to search quotes: ${err.message}` };
    }
});

module.exports = {
    jsonDir,
};
