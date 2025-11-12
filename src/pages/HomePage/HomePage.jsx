// HomePage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./HomePage.module.css";

export default function HomePage() {
    const [quotes, setQuotes] = useState([]);
    const navigate = useNavigate();
    const { labels } = useLanguage();

    // -------------------------------
    // Utilities
    // -------------------------------
    const parseIsoFromFilename = (fileName) => {
        if (!fileName || typeof fileName !== "string") return null;
        // Expected: <name parts>_<YYYY-MM-DD>.json
        const base = fileName.replace(/\.json$/i, "");
        const parts = base.split("_");
        const iso = parts[parts.length - 1];
        return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
    };

    const parseDisplayNameFromFilename = (fileName) => {
        if (!fileName || typeof fileName !== "string") return null;
        // Expected example: AR738ar_Fiat 141 panda_2025-11-11.json
        const base = fileName.replace(/\.json$/i, "");
        const parts = base.split("_");
        if (parts.length >= 3) {
            const license = parts[0] || "";
            const model = parts.slice(1, parts.length - 1).join(" ").trim();
            if (license && model) return `${license} - ${model}`;
            if (license) return license;
            if (model) return model;
        }
        // Fallback to first token if structure differs
        return parts[0] || null;
    };

    const formatIsoToDDMMYYYY = (iso) => {
        if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return labels.noDate;
        const [y, m, d] = iso.split("-");
        return `${d}-${m}-${y}`;
    };

    const toDateObjFromIso = (iso) => {
        if (!iso) return null;
        const [y, m, d] = iso.split("-").map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        return Number.isNaN(dt.getTime()) ? null : dt;
    };

    // Build a display label using priority:
    // Targa (licensePlate), Modello (model), Cliente (client), Telaio (chassis), Anno (year), Assicurazione (insurance)
    // Always use up to two of these, in that order.
    const buildPriorityName = (preview) => {
        if (!preview) return null;
        const ordered = [
            preview.licensePlate,
            preview.model,
            preview.client,
            preview.chassis,
            preview.year,
            preview.insurance,
        ].filter((v) => v != null && String(v).trim() !== "");
        if (ordered.length === 0) return null;
        if (ordered.length === 1) return String(ordered[0]);
        return `${ordered[0]} - ${ordered[1]}`;
    };

    // -------------------------------
    // Fetch quotes from backend (normalized API only)
    // -------------------------------
    useEffect(() => {
        let mounted = true;

        async function fetchQuotes() {
            try {
                const result = await window.api.quotes.list();
                if (!mounted) return;
                if (result?.ok) {
                    setQuotes(result.quotes || []);
                } else {
                    console.error(result?.error || "Unknown error from quotes:list");
                }
            } catch (err) {
                if (!mounted) return;
                console.error("Error fetching quotes:", err);
            }
        }

        fetchQuotes();
        return () => {
            mounted = false;
        };
    }, []);

    // -------------------------------
    // Display-friendly name
    // -------------------------------
    const getDisplayName = (q) => {
        const fromPreview = buildPriorityName(q?.preview);
        if (fromPreview) return fromPreview;

        // Derive from file name if preview lacks data
        const fromFile = parseDisplayNameFromFilename(q?._fileName || q?.file);
        return fromFile || labels.unnamedQuote;
    };

    // -------------------------------
    // Effective ISO date (YYYY-MM-DD)
    // Prefer preview.quoteDate if present/valid, else derive from filename
    // -------------------------------
    const getIsoDate = (q) => {
        const previewDate = q?.preview?.quoteDate;
        if (previewDate && /^\d{4}-\d{2}-\d{2}$/.test(previewDate)) {
            return previewDate;
        }
        return parseIsoFromFilename(q?._fileName || q?.file);
    };

    // -------------------------------
    // Group and sort by date (newest first)
    // -------------------------------
    const groupedByDate = useMemo(() => {
        const buckets = new Map(); // key: ISO date or "noDate", value: array

        for (const q of quotes) {
            const iso = getIsoDate(q) || "noDate";
            if (!buckets.has(iso)) buckets.set(iso, []);
            buckets.get(iso).push(q);
        }

        const entries = Array.from(buckets.entries());
        entries.sort(([isoA], [isoB]) => {
            if (isoA === "noDate" && isoB === "noDate") return 0;
            if (isoA === "noDate") return 1; // push "noDate" at bottom
            if (isoB === "noDate") return -1;
            const dA = toDateObjFromIso(isoA)?.getTime() ?? 0;
            const dB = toDateObjFromIso(isoB)?.getTime() ?? 0;
            return dB - dA; // newest first
        });

        return entries;
    }, [quotes]);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{labels.existingQuotes}</h2>
            {quotes.length === 0 && <p>{labels.noQuotes}</p>}

            <div className={styles.cardsWrapper}>
                {groupedByDate.map(([isoOrNoDate, group]) => {
                    const header = isoOrNoDate === "noDate"
                        ? labels.noDate
                        : formatIsoToDDMMYYYY(isoOrNoDate);

                    return (
                        <div key={isoOrNoDate} className={styles.dateCard}>
                            <div className={styles.dateHeader}>{header}</div>
                            <div className={`${styles.cardsContainer} scrollable`}>
                                {group.map((q, idx) => (
                                    <button
                                        key={`${isoOrNoDate}-${idx}-${q?._fileName || q?.file || "no-file"}`}
                                        className={styles.card}
                                        onClick={() => {
                                            const fname = q?._fileName || q?.file;
                                            if (fname) {
                                                navigate(`/quote/edit/${fname}`);
                                            } else {
                                                console.error("Error: file name missing in quote", q);
                                            }
                                        }}
                                    >
                                        {getDisplayName(q)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
