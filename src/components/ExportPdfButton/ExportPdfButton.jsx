import { useState } from "react";
import { useQuoteData } from "../../contexts/QuoteDataContext";

const ExportPdfButton = () => {
    const { quote } = useQuoteData();
    const [status, setStatus] = useState("");

    const handleExportPdf = async () => {
        try {
            // Show save dialog for PDF
            const { ok, path, canceled } = await window.api.quotes.choosePdfSavePath("quote.pdf");

            if (canceled) {
                setStatus("Export canceled.");
                return;
            }

            if (!ok || !path) {
                setStatus("Failed to choose save path.");
                return;
            }

            const { ok: exportOk, error } = await window.api.quotes.exportToPdf({
                targetPath: path,
                data: quote,
            });

            if (exportOk) {
                setStatus(`PDF saved at: ${path}`);
            } else {
                setStatus(`Failed to export PDF: ${error}`);
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
