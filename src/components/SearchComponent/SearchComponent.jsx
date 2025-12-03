import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./SearchComponent.module.css";

const GENERAL_FIELDS = [
    "client",
    "licensePlate",
    "model",
    "year",
    "chassis",
    "insurance",
    "quoteDate",
];

export default function SearchComponent() {
    const { labels } = useLanguage();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [inputWidth, setInputWidth] = useState(0);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();


    useEffect(() => {
        const measure = () => {
            if (inputRef.current) setInputWidth(inputRef.current.offsetWidth);
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, []);


    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const resp = await window.api.quotes.search(query);
                if (resp?.ok && Array.isArray(resp.matches)) {
                    setResults(
                        resp.matches.map((m) => ({ ...m, _fileName: m.file }))
                    );
                } else {
                    setResults([]);
                    if (resp?.error) console.error("Search error:", resp.error);
                }
            } catch (err) {
                console.error("Search error:", err);
                setResults([]);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [query]);


    const formatIsoToDDMMYYYY = (iso) => {
        if (typeof iso !== "string") return iso;
        const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) return iso;
        const [, y, m, d] = match;
        return `${d}-${m}-${y}`;
    };


    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const highlightMatch = (value, matchedFields, key) => {
        if (!matchedFields?.includes(key)) return value || "";
        const safe = escapeRegex(query);
        if (!safe) return value || "";
        const regex = new RegExp(`(${safe})`, "gi");
        return value
            ? value.toString().split(regex).map((part, i) =>
                regex.test(part) ? <mark key={i}>{part}</mark> : part
            )
            : "";
    };

    const renderFieldValue = (res, field) => {
        let raw = res.preview?.[field] ?? "";
        if (field === "quoteDate") raw = formatIsoToDDMMYYYY(raw);
        return highlightMatch(raw, res.matchedFields, field);
    };

    const handleClick = (fileName) => {
        if (!fileName) return;
        navigate(`/quote/edit/${fileName}`);
        setResults([]);
    };

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            <input
                type="text"
                ref={inputRef}
                placeholder={labels.search_placeholder || "Search..."}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={styles.input}
            />

            {results.length > 0 && (
                <div className={styles.results} style={{ width: inputWidth }}>
                    {results.map((res, idx) => (
                        <button
                            key={idx}
                            type="button"
                            className={styles.resultCard}
                            onClick={() => handleClick(res._fileName)}
                        >
                            {GENERAL_FIELDS.map((field) => (
                                <div key={field} className={styles.resultRow}>
                                    <strong>{labels[field] || field}:</strong>{" "}
                                    <span>{renderFieldValue(res, field)}</span>
                                </div>
                            ))}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
