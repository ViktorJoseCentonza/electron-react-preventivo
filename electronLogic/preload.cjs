




const { contextBridge, ipcRenderer } = require("electron");




const invoke = async (channel, payload) => {
    try {
        return await ipcRenderer.invoke(channel, payload);
    } catch (err) {
        return { ok: false, error: String(err && err.message ? err.message : err) };
    }
};


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




const api = {
    quotes: {

        baseDir: () => invoke("quotes:base-dir"),
        list: () => invoke("quotes:list"),
        read: (fileName) => invoke("quotes:read", fileName),
        write: ({ filename, data }) => invoke("quotes:write", { filename, data }),
        autosave: ({ filename, data }) =>
            invoke("quotes:auto-save", { filename, data }),
        delete: (fileName) => invoke("quotes:delete", fileName),
        exists: (fileName) => invoke("quotes:exists", fileName),
        rename: ({ oldName, newName }) =>
            invoke("quotes:rename", { oldName, newName }),
        search: (query) => invoke("quotes:search", query),


        chooseSavePath: (defaultName) =>
            invoke("quotes:choose-save-path", defaultName),
        exportToPath: ({ targetPath, data }) =>
            invoke("quotes:export-to-path", { targetPath, data }),


        choosePdfSavePath: (defaultName) =>
            invoke("quotes:choose-pdf-save-path", defaultName),


        exportToPdf: ({ targetPath, data, anonymize }) => {
            console.log(
                "[preload] quotes.exportToPdf called with anonymize:",
                anonymize
            );
            return invoke("quotes:export-to-pdf", {
                targetPath,
                data,
                anonymize,
            });
        },
    },
};







const legacy = {
    saveQuote: deprecate(
        "saveQuote",
        "api.quotes.write",
        ({ filename, data }) => api.quotes.write({ filename, data })
    ),

    saveQuoteAuto: deprecate(
        "saveQuoteAuto",
        "api.quotes.autosave",
        ({ filename, data }) => api.quotes.autosave({ filename, data })
    ),

    readQuote: deprecate("readQuote", "api.quotes.read", (fileName) =>
        api.quotes.read(fileName)
    ),

    deleteQuote: deprecate(
        "deleteQuote",
        "api.quotes.delete",
        (fileName) => api.quotes.delete(fileName)
    ),

    listQuotes: deprecate("listQuotes", "api.quotes.list", () =>
        api.quotes.list()
    ),

    chooseSavePath: deprecate(
        "chooseSavePath",
        "api.quotes.chooseSavePath",
        (defaultName) => api.quotes.chooseSavePath(defaultName)
    ),

    exportJSONAtPath: deprecate(
        "exportJSONAtPath",
        "api.quotes.exportToPath",
        ({ path, data }) => api.quotes.exportToPath({ targetPath: path, data })
    ),

    searchQuotes: deprecate(
        "searchQuotes",
        "api.quotes.search",
        (query) => api.quotes.search(query)
    ),
};




contextBridge.exposeInMainWorld("api", {
    ...api,
    ...legacy,
});
