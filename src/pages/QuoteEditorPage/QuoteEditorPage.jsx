import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ExportPdfButton from "../../components/ExportPdfButton/ExportPdfButton";
import QuoteEditor from "../../components/QuoteEditor/QuoteEditor";
import QuoteSave from "../../components/QuoteSave/QuoteSave";
import { defaultQuote, useQuoteData } from "../../contexts/QuoteDataContext";
import { useQuoteState } from "../../contexts/QuoteStateContext";

export default function QuoteEditorPage() {
    const { fileName } = useParams();  // Get fileName from the URL parameters
    const { quote, update, resetQuote, setQuoteDirect } = useQuoteData();
    const { markDirty, markSaved } = useQuoteState();

    const [loading, setLoading] = useState(true);  // Initially set to loading state
    const [error, setError] = useState(null);

    // Fetch quote data or reset to a new quote based on the fileName
    useEffect(() => {
        if (fileName) {
            // Fetch the existing quote if a fileName is provided (edit mode)
            async function fetchQuote() {
                if (!window.api?.readQuote) {
                    setError("IPC not available");
                    setLoading(false);
                    return;
                }

                try {
                    const result = await window.api.readQuote(fileName);
                    if (!result.ok) {
                        setError(result.error || "Failed to load quote");
                        setLoading(false);
                        return;
                    }

                    const data = result.data || {};
                    // Normalize and merge data with defaults
                    const next = {
                        ...defaultQuote,
                        general: { ...defaultQuote.general, ...(data.quote || {}) },
                        items: Array.isArray(data.items) ? data.items : [],
                        complementary: {
                            ...defaultQuote.complementary,
                            ...(data.complementary || {}),
                            parts: { ...defaultQuote.complementary.parts, ...(data.complementary?.parts || {}) },
                            bodywork: { ...defaultQuote.complementary.bodywork, ...(data.complementary?.bodywork || {}) },
                            mechanics: { ...defaultQuote.complementary.mechanics, ...(data.complementary?.mechanics || {}) },
                            consumables: { ...defaultQuote.complementary.consumables, ...(data.complementary?.consumables || {}) },
                            partsTotal: { ...defaultQuote.complementary.partsTotal, ...(data.complementary?.partsTotal || {}) },
                        },
                        totals: { ...defaultQuote.totals }, // Totals will be recomputed
                    };

                    // Set the fetched data to the quote context
                    setQuoteDirect(next);
                    markSaved(fileName);
                    setLoading(false);
                } catch (err) {
                    setError(String(err));
                    setLoading(false);
                }
            }

            fetchQuote();
        } else {
            // Reset quote to default values if no fileName (create mode)
            resetQuote();
            markDirty(false);
            setLoading(false);
        }
    }, [fileName, resetQuote, setQuoteDirect, markSaved, markDirty]);

    // Show loading or error states
    if (loading) return <p className="p-4">Loading quote...</p>;
    if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

    return (
        <div className="p-4 flex flex-col gap-4">
            <QuoteEditor /> {/* The QuoteEditor component for editing the quote */}

            <div className="mt-4 flex gap-2">
                <QuoteSave fileName={fileName} mode={fileName ? "edit" : "create"} /> {/* Save or Save As */}
                <ExportPdfButton />
            </div>
        </div>
    );
}
