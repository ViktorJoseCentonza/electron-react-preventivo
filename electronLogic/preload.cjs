const { contextBridge, ipcRenderer } = require("electron");

const invoke = async (channel, payload) => {
    try {
        return await ipcRenderer.invoke(channel, payload);
    } catch (err) {
        return { ok: false, error: String(err && err.message ? err.message : err) };
    }
};

contextBridge.exposeInMainWorld("api", {
    // -------------------------------
    // JSON (NEW) — structured namespace
    // -------------------------------
    quotes: {
        baseDir: () => invoke("quotes:base-dir"),
        list: () => invoke("quotes:list"),
        read: (fileName) => invoke("quotes:read", fileName),
        write: ({ filename, data }) => invoke("quotes:write", { filename, data }),
        autosave: ({ filename, data }) => invoke("quotes:auto-save", { filename, data }),
        delete: (fileName) => invoke("quotes:delete", fileName),
        exists: (fileName) => invoke("quotes:exists", fileName),
        rename: ({ oldName, newName }) => invoke("quotes:rename", { oldName, newName }),
        chooseSavePath: (defaultName) => invoke("quotes:choose-save-path", defaultName),
        exportToPath: ({ targetPath, data }) => invoke("quotes:export-to-path", { targetPath, data }),
        search: (query) => invoke("quotes:search", query),
        // New functions for PDF export
        exportToPdf: ({ targetPath, data }) => invoke("quotes:export-to-pdf", { targetPath, data }),
        choosePdfSavePath: (defaultName) => invoke("quotes:choose-pdf-save-path", defaultName),
    },

    // -------------------------------
    // JSON (LEGACY ALIASES) — backward compatible with your existing UI code
    // -------------------------------
    saveQuote: ({ filename, data }) => invoke("quotes:write", { filename, data }),
    saveQuoteAuto: ({ filename, data }) => invoke("quotes:auto-save", { filename, data }),
    readQuote: (fileName) => invoke("quotes:read", fileName),
    deleteQuote: (fileName) => invoke("quotes:delete", fileName),
    listQuotes: () => invoke("quotes:list"),
    chooseSavePath: (defaultName) => invoke("quotes:choose-save-path", defaultName),
    exportJSONAtPath: ({ path, data }) => invoke("quotes:export-to-path", { targetPath: path, data }),
    searchQuotes: (query) => invoke("quotes:search", query),
});
