import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuote } from "../../contexts/QuoteContext";
import styles from "./QuoteSave.module.css";

/**
 * QuoteSave Component
 * Automatically saves the current quote state to the app's folder with a generated filename
 * Also allows manual save with custom name/location
 */
export default function QuoteSave({ mode = "create" }) {
    const { labels } = useLanguage();
    const { quote, items, complementaryItems } = useQuote();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    const getQuoteData = () => ({
        quote,
        items,
        complementary: complementaryItems
    });

    const formatDateForFilename = (dateStr) => {
        if (!dateStr) {
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, "0");
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const yyyy = now.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        }
        return dateStr.replace(/\//g, "-"); // DD/MM/YYYY → DD-MM-YYYY
    };

    const generateFilename = () => {
        const license = quote.licensePlate?.trim();
        const model = quote.model?.trim();
        const client = quote.client?.trim();
        const date = formatDateForFilename(quote.quoteDate);

        if (license && model) return `${license}_${model}_${date}.json`;
        if (client && model) return `${client}_${model}_${date}.json`;
        if (license && client) return `${license}_${client}_${date}.json`;
        if (client) return `${client}_no-model_${date}.json`;

        return `no-info_${date}.json`;
    };

    const autoSaveQuote = async () => {
        setIsSaving(true);
        setMessage("");

        try {
            const filename = generateFilename();

            const saveResult = await window.api.exportJSONAuto({
                filename,
                data: getQuoteData()
            });

            if (!saveResult.ok) throw new Error(saveResult.error);

            setMessage(labels.quote_saved || "Quote saved successfully!");
        } catch (err) {
            console.error("Error saving quote:", err);
            setMessage(labels.quote_save_error || "Error saving quote.");
        } finally {
            setIsSaving(false);
        }
    };

    const manualSaveQuote = async () => {
        setIsSaving(true);
        setMessage("");

        try {
            const defaultName = generateFilename();
            const result = await window.api.chooseSavePath(defaultName);

            if (!result.ok) {
                setMessage(labels.quote_save_canceled || "Save canceled.");
                return;
            }

            const saveResult = await window.api.exportJSONAtPath({
                path: result.path,
                data: getQuoteData()
            });

            if (!saveResult.ok) throw new Error(saveResult.error);

            setMessage(labels.quote_saved || "Quote saved successfully!");
        } catch (err) {
            console.error("Error saving quote:", err);
            setMessage(labels.quote_save_error || "Error saving quote.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.container}>
            <button
                onClick={autoSaveQuote}
                disabled={isSaving}
                className={styles.saveButton}
            >
                {isSaving
                    ? labels.saving || "Saving..."
                    : labels.save_quote || "Auto Save Quote"}
            </button>

            <button
                onClick={manualSaveQuote}
                disabled={isSaving}
                className={`${styles.saveButton} ${styles.manualButton}`}
            >
                {labels.save_quote_manual || "Save Quote Manually"}
            </button>

            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
}
