// preload.cjs
// Exposes a normalized API to the renderer while preserving legacy aliases.
// Duplicated names are consolidated; legacy names call into the single source of truth
// and emit a one-time deprecation warning so you can migrate safely.

const { contextBridge, ipcRenderer } = require("electron");

// -------------------------------
// Internal helpers
// -------------------------------
const invoke = async (channel, payload) => {
    try {
        return await ipcRenderer.invoke(channel, payload);
    } catch (err) {
        return { ok: false, error: String(err && err.message ? err.message : err) };
    }
};

// one-time deprecation warnings
const warned = new Set();
const deprecate = (oldName, newPath, fn) => {
    return (...args) => {
        if (!warned.has(oldName)) {
            console.warn(`[DEPRECATION] "${oldName}" is deprecated. Use "${newPath}" instead.`);
            warned.add(oldName);
        }
        return fn(...args);
    };
};

// -------------------------------
// Normalized API surface
// -------------------------------
const api = {
    quotes: {
        // Filesystem / storage
        baseDir: () => invoke("quotes:base-dir"),
        list: () => invoke("quotes:list"),
        read: (fileName) => invoke("quotes:read", fileName),
        write: ({ filename, data }) => invoke("quotes:write", { filename, data }),
        autosave: ({ filename, data }) => invoke("quotes:auto-save", { filename, data }),
        delete: (fileName) => invoke("quotes:delete", fileName),
        exists: (fileName) => invoke("quotes:exists", fileName),
        rename: ({ oldName, newName }) => invoke("quotes:rename", { oldName, newName }),
        search: (query) => invoke("quotes:search", query),

        // Export JSON
        chooseSavePath: (defaultName) => invoke("quotes:choose-save-path", defaultName),
        exportToPath: ({ targetPath, data }) => invoke("quotes:export-to-path", { targetPath, data }),

        // Export PDF (Chromium printToPDF pipeline)
        choosePdfSavePath: (defaultName) => invoke("quotes:choose-pdf-save-path", defaultName),
        exportToPdf: ({ targetPath, data }) => invoke("quotes:export-to-pdf", { targetPath, data }),
    },
};

// -------------------------------
// Legacy aliases (kept, but deprecate)
//
// These forward to the normalized API above to avoid duplicate logic.
// You can remove these once the app has migrated.
// -------------------------------
const legacy = {
    saveQuote: deprecate("saveQuote", "api.quotes.write", ({ filename, data }) =>
        api.quotes.write({ filename, data })
    ),
    saveQuoteAuto: deprecate("saveQuoteAuto", "api.quotes.autosave", ({ filename, data }) =>
        api.quotes.autosave({ filename, data })
    ),
    readQuote: deprecate("readQuote", "api.quotes.read", (fileName) =>
        api.quotes.read(fileName)
    ),
    deleteQuote: deprecate("deleteQuote", "api.quotes.delete", (fileName) =>
        api.quotes.delete(fileName)
    ),
    listQuotes: deprecate("listQuotes", "api.quotes.list", () =>
        api.quotes.list()
    ),
    chooseSavePath: deprecate("chooseSavePath", "api.quotes.chooseSavePath", (defaultName) =>
        api.quotes.chooseSavePath(defaultName)
    ),
    exportJSONAtPath: deprecate("exportJSONAtPath", "api.quotes.exportToPath", ({ path, data }) =>
        api.quotes.exportToPath({ targetPath: path, data })
    ),
    searchQuotes: deprecate("searchQuotes", "api.quotes.search", (query) =>
        api.quotes.search(query)
    ),
};

// -------------------------------
// Expose to renderer
// -------------------------------
contextBridge.exposeInMainWorld("api", {
    ...api,
    ...legacy,
});
