import { useState } from "react";
import { useQuoteData } from "../../contexts/QuoteDataContext";

const ExportPdfButton = () => {
    const { quote } = useQuoteData();
    const [status, setStatus] = useState("");

    const withTimeout = (promise, ms, onTimeout) =>
        new Promise((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) {
                    onTimeout?.();
                    resolve({ ok: false, error: `Timed out after ${ms}ms` });
                }
            }, ms);
            promise
                .then((v) => {
                    settled = true;
                    clearTimeout(timer);
                    resolve(v);
                })
                .catch((e) => {
                    settled = true;
                    clearTimeout(timer);
                    resolve({ ok: false, error: e?.message || String(e) });
                });
        });

    // Prova a recuperare il path originale del JSON, se lo tieni nel quote
    const getSourceJsonPath = (quote) => {
        if (!quote || typeof quote !== "object") return "";
        // adatta questi campi ai tuoi dati reali se usi nomi diversi
        return (
            quote.meta?.filePath ||
            quote.meta?.path ||
            quote.filePath ||
            quote.path ||
            ""
        );
    };

    // Se non abbiamo un path, costruiamo un nome file decente dal contenuto
    const buildFallbackPdfName = (quote) => {
        const g = (quote && (quote.general || quote.quote)) || {};

        const parts = [];
        if (g.client) parts.push(g.client);
        if (g.licensePlate) parts.push(g.licensePlate);
        if (g.quoteDate) parts.push(g.quoteDate);

        let base = parts.join(" - ").trim() || "quote";

        // pulizia per nome file (no caratteri illegali)
        base = base.replace(/[<>:"/\\|?*]+/g, "_");

        return `${base}.pdf`;
    };

    const getDefaultSaveInput = (quote) => {
        const sourcePath = getSourceJsonPath(quote);
        if (sourcePath) {
            // Il main prenderà questo path, userà la stessa dir
            // e cambierà l'estensione in .pdf
            return sourcePath;
        }
        // Altrimenti passiamo solo un nome file suggerito
        return buildFallbackPdfName(quote);
    };

    const handleExportPdf = async () => {
        if (!quote) {
            setStatus("No quote data available.");
            return;
        }

        setStatus("Preparing PDF…");

        try {
            const defaultSaveInput = getDefaultSaveInput(quote);

            const { ok, path, canceled, error } = await withTimeout(
                window.api?.quotes?.choosePdfSavePath?.(defaultSaveInput),
                15000,
                () => setStatus("Save dialog taking too long…")
            );

            if (!ok) {
                if (canceled) {
                    setStatus("Export canceled.");
                    return;
                }
                setStatus(`Failed to choose save path: ${error || "unknown error"}`);
                return;
            }

            if (!path) {
                setStatus("No path selected.");
                return;
            }

            setStatus("Generating PDF…");

            const { ok: exportOk, error: exportErr } = await withTimeout(
                window.api?.quotes?.exportToPdf?.({ targetPath: path, data: quote }),
                30000,
                () => setStatus("PDF generation taking longer than expected…")
            );

            if (exportOk) {
                setStatus(`PDF successfully saved at: ${path}`);
            } else {
                setStatus(`Failed to export PDF: ${exportErr || "unknown error"}`);
            }
        } catch (error) {
            setStatus(`Error: ${error.message}`);
        }
    };

    return (
        <div>
            <button onClick={handleExportPdf}>Export as PDF</button>
            <p>{status}</p>
        </div>
    );
};

export default ExportPdfButton;
