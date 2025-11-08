// pages/EditQuotePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ComplementaryItemsTable from "../components/ComplementaryItemsTable/ComplementaryItemsTable";
import QuoteGeneralFields from "../components/QuoteGeneralFields/QuoteGeneralFields";
import QuoteItemsTable from "../components/QuoteItemsTable/QuoteItemsTable";
import { useQuote } from "../contexts/QuoteContext";

export default function EditQuotePage() {
    const { fileName } = useParams();
    const navigate = useNavigate();
    const {
        quote,
        updateQuoteField,
        items,
        setItems,
        autoTotals,
        setAutoTotals,
        complementaryItems,
        updateComplementaryField,
    } = useQuote();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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

                const data = result.data;

                // Populate context state
                if (data.quote) {
                    Object.entries(data.quote).forEach(([field, value]) => {
                        updateQuoteField(field, value);
                    });
                }

                if (Array.isArray(data.items)) {
                    setItems(data.items);
                }

                if (data.complementary) {
                    Object.entries(data.complementary).forEach(([group, values]) => {
                        Object.entries(values).forEach(([field, value]) => {
                            updateComplementaryField(group, field, value);
                        });
                    });
                }

                if (data.autoTotals) {
                    setAutoTotals(data.autoTotals);
                }

                setLoading(false);
            } catch (err) {
                setError(String(err));
                setLoading(false);
            }
        }

        fetchQuote();
        // Only run on mount or if fileName changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fileName]);


    if (loading) return <p className="p-4">Loading quote...</p>;
    if (error) return <p className="p-4 text-red-600">Error: {error}</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Edit Quote</h1>

            <QuoteGeneralFields quote={quote} update={updateQuoteField} />

            <QuoteItemsTable
                items={items}
                setItems={setItems}
                onTotalsChange={(totals) => setAutoTotals(totals)}
            />

            <ComplementaryItemsTable complementaryItems={complementaryItems} updateComplementaryField={updateComplementaryField} />

            <button
                className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
                onClick={() => navigate("/")}
            >
                Back to Home
            </button>
        </div>
    );
}
