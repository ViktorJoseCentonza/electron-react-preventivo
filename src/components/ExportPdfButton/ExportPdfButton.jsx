import { useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuoteData } from "../../contexts/QuoteDataContext";
import styles from "./ExportPdfButton.module.css";

const ExportPdfButton = () => {
    const { labels } = useLanguage();
    const { quote } = useQuoteData();
    const [status, setStatus] = useState("");
    const [statusKind, setStatusKind] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [anonymize, setAnonymize] = useState(false);

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

    const getSourceJsonPath = (quote) => {
        if (!quote || typeof quote !== "object") return "";
        return (
            quote.meta?.filePath ||
            quote.meta?.path ||
            quote.filePath ||
            quote.path ||
            ""
        );
    };

    const buildFallbackPdfName = (quote) => {
        const g = (quote && (quote.general || quote.quote)) || {};

        const parts = [];
        if (g.client) parts.push(g.client);
        if (g.licensePlate) parts.push(g.licensePlate);
        if (g.quoteDate) parts.push(g.quoteDate);

        let base = parts.join(" - ").trim() || "quote";


        base = base.replace(/[<>:"/\\|?*]+/g, "_");

        return `${base}.pdf`;
    };

    const getDefaultSaveInput = (quote) => {
        const sourcePath = getSourceJsonPath(quote);
        if (sourcePath) {
            return sourcePath;
        }
        return buildFallbackPdfName(quote);
    };

    const handleExportPdf = async () => {
        if (!quote) {
            setStatus(labels.pdf_no_quote_data);
            setStatusKind("error");
            return;
        }

        setIsLoading(true);
        setStatus(labels.exporting);
        setStatusKind("info");

        try {
            const defaultSaveInput = getDefaultSaveInput(quote);

            const { ok, path, canceled, error } = await withTimeout(
                window.api?.quotes?.choosePdfSavePath?.(defaultSaveInput),
                15000,
                () => {
                    setStatus(labels.pdf_save_dialog_slow);
                    setStatusKind("info");
                }
            );

            if (!ok) {
                if (canceled) {
                    setStatus(labels.pdf_export_canceled);
                    setStatusKind("info");
                    return;
                }
                setStatus(
                    `${labels.pdf_export_error} ${error || ""}`.trim()
                );
                setStatusKind("error");
                return;
            }

            if (!path) {
                setStatus(labels.pdf_no_path_selected);
                setStatusKind("error");
                return;
            }

            setStatus(labels.exporting);
            setStatusKind("info");

            const { ok: exportOk, error: exportErr } = await withTimeout(
                window.api?.quotes?.exportToPdf?.({
                    targetPath: path,
                    data: quote,
                    anonymize,
                }),
                30000,
                () => {
                    setStatus(labels.pdf_generation_slow);
                    setStatusKind("info");
                }
            );

            if (exportOk) {
                setStatus(labels.pdf_exported);
                setStatusKind("success");
            } else {
                setStatus(
                    `${labels.pdf_export_error} ${exportErr || ""}`.trim()
                );
                setStatusKind("error");
            }
        } catch (error) {
            setStatus(
                `${labels.pdf_export_error} ${error?.message || ""}`.trim()
            );
            setStatusKind("error");
        } finally {
            setIsLoading(false);
        }
    };

    let statusClassName = styles.statusMessage;
    if (statusKind === "success") {
        statusClassName += ` ${styles.statusSuccess}`;
    } else if (statusKind === "error") {
        statusClassName += ` ${styles.statusError}`;
    }

    return (
        <div className={styles.container}>
            <div className={styles.buttonRow}>
                <button
                    type="button"
                    onClick={handleExportPdf}
                    className={styles.exportButton}
                    disabled={isLoading || !quote}
                    aria-busy={isLoading}
                >
                    {isLoading && (
                        <span className={styles.spinner} aria-hidden="true" />
                    )}
                    <span>{isLoading ? labels.exporting : labels.export_pdf}</span>
                </button>
            </div>

            <div className={styles.optionsRow}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={anonymize}
                        onChange={(e) => setAnonymize(e.target.checked)}
                    />
                    <span>{labels.pdf_anonymous_label}</span>
                </label>
            </div>

            <p className={statusClassName} aria-live="polite">
                {status || "\u00A0"}
            </p>
        </div>
    );
};

export default ExportPdfButton;
