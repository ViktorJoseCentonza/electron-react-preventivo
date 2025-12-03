import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ExportPdfButton from "../../components/ExportPdfButton/ExportPdfButton";
import QuoteEditor from "../../components/QuoteEditor/QuoteEditor";
import QuoteSave from "../../components/QuoteSave/QuoteSave";
import { defaultQuote, useQuoteData } from "../../contexts/QuoteDataContext";
import { useQuoteState } from "../../contexts/QuoteStateContext";
import styles from "./QuoteEditorPage.module.css";

export default function QuoteEditorPage() {
    const { fileName } = useParams();
    const { quote, update, resetQuote, setQuoteDirect } = useQuoteData();
    const { markDirty, markSaved } = useQuoteState();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        if (fileName) {

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

                    const next = {
                        ...defaultQuote,
                        general: { ...defaultQuote.general, ...(data.quote || {}) },
                        items: Array.isArray(data.items) ? data.items : [],
                        complementary: {
                            ...defaultQuote.complementary,
                            ...(data.complementary || {}),
                            parts: {
                                ...defaultQuote.complementary.parts,
                                ...(data.complementary?.parts || {})
                            },
                            bodywork: {
                                ...defaultQuote.complementary.bodywork,
                                ...(data.complementary?.bodywork || {})
                            },
                            mechanics: {
                                ...defaultQuote.complementary.mechanics,
                                ...(data.complementary?.mechanics || {})
                            },
                            consumables: {
                                ...defaultQuote.complementary.consumables,
                                ...(data.complementary?.consumables || {})
                            },
                            partsTotal: {
                                ...defaultQuote.complementary.partsTotal,
                                ...(data.complementary?.partsTotal || {})
                            },
                        },
                        totals: { ...defaultQuote.totals },
                    };


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

            resetQuote();
            markDirty(false);
            setLoading(false);
        }
    }, [fileName, resetQuote, setQuoteDirect, markSaved, markDirty]);


    if (loading) return <p className={styles.loading}>Loading quote...</p>;
    if (error) return <p className={styles.error}>Error: {error}</p>;

    return (
        <div className={styles.container}>
            <QuoteEditor /> { }

            <div className={styles.actionsRow}>
                <QuoteSave fileName={fileName} mode={fileName ? "edit" : "create"} /> { }
                <ExportPdfButton />
            </div>
        </div>
    );
}
