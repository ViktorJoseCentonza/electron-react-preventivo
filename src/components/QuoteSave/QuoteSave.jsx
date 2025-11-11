import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuoteData } from "../../contexts/QuoteDataContext";
import { useQuoteState } from "../../contexts/QuoteStateContext";
import styles from "./QuoteSave.module.css";

export default function QuoteSave() {
    const { labels } = useLanguage();
    const { quote } = useQuoteData();
    const { markSaved } = useQuoteState();

    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    // Local builder: shape the JSON exactly as QuoteEditorPage expects when reading
    const buildExportData = () => {
        return {
            // `quote` section (general data)
            quote: {
                client: quote.general?.client ?? "",
                licensePlate: quote.general?.licensePlate ?? "",
                model: quote.general?.model ?? "",
                year: quote.general?.year ?? "",
                chassis: quote.general?.chassis ?? "",
                insurance: quote.general?.insurance ?? "",
                quoteDate: quote.general?.quoteDate ?? "",
            },
            // items array (already without any ghost row)
            items: Array.isArray(quote.items) ? quote.items : [],
            // complementary groups + partsTotal
            complementary: {
                parts: { ...(quote.complementary?.parts ?? {}) },
                bodywork: { ...(quote.complementary?.bodywork ?? {}) },
                mechanics: { ...(quote.complementary?.mechanics ?? {}) },
                consumables: { ...(quote.complementary?.consumables ?? {}) },
                partsTotal: { ...(quote.complementary?.partsTotal ?? {}) },
            },
            // final totals (use current computed ones)
            totals: {
                subtotal: quote.totals?.subtotal ?? 0,
                iva: quote.totals?.iva ?? 0,
                totalWithIva: quote.totals?.totalWithIva ?? 0,
            },
        };
    };

    const formatDateForFilename = (dateStr) => {
        if (!dateStr) {
            const now = new Date();
            return `${String(now.getDate()).padStart(2, "0")}-${String(now.getMonth() + 1).padStart(2, "0")}-${now.getFullYear()}`;
        }
        return String(dateStr).replace(/\//g, "-");
    };

    const generateFilename = () => {
        const license = quote.general?.licensePlate?.trim();
        const model = quote.general?.model?.trim();
        const client = quote.general?.client?.trim();
        const date = formatDateForFilename(quote.general?.quoteDate);

        if (license && model) return `${license}_${model}_${date}.json`;
        if (client && model) return `${client}_${model}_${date}.json`;
        if (license && client) return `${license}_${client}_${date}.json`;
        if (client) return `${client}_no-model_${date}.json`;
        return `no-info_${date}.json`;
    };

    const saveQuote = async (manual = false) => {
        setIsSaving(true);
        setMessage("");
        setIsError(false);

        try {
            const data = buildExportData();
            const filename = generateFilename();

            if (manual) {
                // Manual "Save As"
                const dialogResult = await window.api.quotes.chooseSavePath(filename);
                if (!dialogResult.ok) {
                    setMessage(labels.quote_save_canceled);
                    return;
                }
                const writeResult = await window.api.quotes.exportToPath({
                    targetPath: dialogResult.path,
                    data,
                });
                if (!writeResult.ok) throw new Error(writeResult.error);
                markSaved(dialogResult.path);
            } else {
                // Autosave to default folder
                const result = await window.api.quotes.autosave({ filename, data });
                if (!result.ok) throw new Error(result.error);
                markSaved(filename);
            }

            setMessage(labels.quote_saved);
        } catch (err) {
            console.error("Error saving quote:", err);
            setIsError(true);
            setMessage(labels.quote_save_error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.buttons}>
                <button
                    disabled={isSaving}
                    onClick={() => saveQuote(false)}
                    className={styles.saveButton}
                >
                    {isSaving ? <span className={styles.spinner} /> : labels.save_quote}
                </button>

                <button
                    disabled={isSaving}
                    onClick={() => saveQuote(true)}
                    className={`${styles.saveButton} ${styles.manualButton}`}
                >
                    {labels.save_quote_manual}
                </button>
            </div>

            {message && (
                <p className={`${styles.message} ${isError ? styles.error : styles.success}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
