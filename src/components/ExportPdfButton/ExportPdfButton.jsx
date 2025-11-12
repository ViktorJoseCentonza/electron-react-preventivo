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

    const handleExportPdf = async () => {
        if (!quote) {
            setStatus("No quote data available.");
            return;
        }

        setStatus("Preparing PDF…");

        try {
            const { ok, path, canceled, error } = await withTimeout(
                window.api?.quotes?.choosePdfSavePath?.("quote.pdf"),
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
