import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./HomePage.module.css";

export default function HomePage() {
    const [quotes, setQuotes] = useState([]);
    const navigate = useNavigate();
    const { labels } = useLanguage();

    // Fetch quotes from the backend
    useEffect(() => {
        async function fetchQuotes() {
            if (!window.api?.listQuotes) return;
            try {
                const result = await window.api.listQuotes();
                if (result.ok) {
                    setQuotes(result.quotes || []);
                } else {
                    console.error(result.error);
                }
            } catch (err) {
                console.error("Error fetching quotes:", err);
            }
        }
        fetchQuotes();
    }, []);

    // Get the date from the quote JSON, fallback to "noDate"
    const extractDate = (quote) => quote?.quote?.quoteDate || labels.noDate;

    // Display-friendly name for a quote
    const getDisplayName = (quote) => {
        const client = quote?.quote?.client;
        const model = quote?.quote?.model;

        // If both client and model are present, display them
        if (client && model) return `${client} - ${model}`;

        // If the filename is present, clean it up for display
        if (quote?._fileName) {
            const cleaned = quote._fileName.replace(".json", "").split("_");
            cleaned.pop(); // remove old date part
            return cleaned.join(" ") || labels.unnamedQuote; // Join parts with space
        }

        return labels.unnamedQuote; // Fallback if no client, model, or filename
    };

    // Group quotes by date, newest first
    const groupedByDate = useMemo(() => {
        const groups = {};
        quotes.forEach((q) => {
            const date = extractDate(q);
            if (!groups[date]) groups[date] = [];
            groups[date].push(q);
        });

        return Object.entries(groups).sort(([d1], [d2]) => {
            const parse = (d) => d.split("-").map(Number);
            const [day1, month1, year1] = parse(d1);
            const [day2, month2, year2] = parse(d2);
            return new Date(year2, month2 - 1, day2) - new Date(year1, month1 - 1, day1);
        });
    }, [quotes]);

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>{labels.existingQuotes}</h2>
            {quotes.length === 0 && <p>{labels.noQuotes}</p>}

            <div className={styles.cardsWrapper}>
                {groupedByDate.map(([date, group]) => (
                    <div key={date} className={styles.dateCard}>
                        <div className={styles.dateHeader}>{date}</div>
                        <div className={`${styles.cardsContainer} scrollable`}>
                            {group.map((q, idx) => (
                                <button
                                    key={idx}
                                    className={styles.card}
                                    onClick={() => {
                                        if (q._fileName) {
                                            // Correctly navigating to the edit page with the file name
                                            navigate(`/quote/edit/${q._fileName}`);
                                        } else {
                                            console.error("Error: _fileName is missing in quote", q);
                                        }
                                    }}
                                >
                                    {getDisplayName(q)}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}