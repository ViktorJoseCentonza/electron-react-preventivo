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
    const wrapperRef = useRef();
    const inputRef = useRef();
    const navigate = useNavigate();

    // Measure input width
    useEffect(() => {
        if (inputRef.current) {
            setInputWidth(inputRef.current.offsetWidth);
        }
    }, [inputRef.current?.offsetWidth]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                const matches = await window.api.searchQuotes(query);
                const normalized = matches.map((res) => ({
                    ...res,
                    _fileName: res.file,
                }));
                setResults(normalized);
            } catch (err) {
                console.error("Search error:", err);
            }
        }, 200);

        return () => clearTimeout(timeout);
    }, [query]);

    const highlightMatch = (value, matchedFields, key) => {
        if (!matchedFields.includes(key)) return value;
        const regex = new RegExp(`(${query})`, "gi");
        return value
            ? value.toString().split(regex).map((part, i) =>
                regex.test(part) ? <mark key={i}>{part}</mark> : part
            )
            : "";
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
                <div
                    className={styles.results}
                    style={{ width: inputWidth }}
                >
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
                                    <span>
                                        {highlightMatch(
                                            res.data?.quote?.[field] ?? "",
                                            res.matchedFields,
                                            field
                                        )}
                                    </span>
                                </div>
                            ))}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
