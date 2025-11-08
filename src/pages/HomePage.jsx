import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export default function HomePage() {
    const [quotes, setQuotes] = useState([]);
    const navigate = useNavigate();
    const { labels } = useLanguage();

    useEffect(() => {
        async function fetchQuotes() {
            if (window.api?.listQuotes) {
                const result = await window.api.listQuotes();
                if (result.ok) setQuotes(result.quotes);
                else console.error(result.error);
            }
        }
        fetchQuotes();
    }, []);

    // Get display name: client + model if available, else fallback to filename
    const getDisplayName = (quote) => {
        if (quote.client && quote.model) {
            return `${quote.client} - ${quote.model}`;
        }
        if (quote._fileName) {
            // Remove extension and replace underscores with spaces
            return quote._fileName.replace(".json", "").replace(/_/g, " ");
        }
        return labels.unnamedQuote;
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{labels.homeTitle}</h1>

            <h2 className="text-xl font-semibold mb-2">{labels.existingQuotes}</h2>
            {quotes.length === 0 && <p>{labels.noQuotes}</p>}

            <ul>
                {quotes.map((q, index) => (
                    <li key={index}>
                        <button
                            className="text-left w-full mb-2 p-2 border rounded hover:bg-gray-700"
                            onClick={() => navigate(`/quote/edit/${q._fileName}`)}
                        >
                            {getDisplayName(q)}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
