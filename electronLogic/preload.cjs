const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
    // --- JSON Handlers ---
    exportJSON: (data) => ipcRenderer.invoke("export-json", data),
    chooseSavePath: (defaultName) => ipcRenderer.invoke("choose-save-path", defaultName),
    exportJSONAtPath: ({ path, data }) => ipcRenderer.invoke("export-json-at-path", { path, data }),

    // --- PDF Handlers ---
    chooseSavePDF: () => ipcRenderer.invoke("choose-save-pdf"),
    exportPDFAtPath: ({ path, data }) => ipcRenderer.invoke("export-pdf-at-path", { path, data }),

    // --- Quotes Folder / DB Handlers ---
    listQuotes: () => ipcRenderer.invoke("list-quotes"), // match ipcQuotes.js
    readQuote: (fileName) => ipcRenderer.invoke("read-quote", fileName),
    deleteQuote: (fileName) => ipcRenderer.invoke("delete-quote", fileName),

});
