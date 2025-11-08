import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";

export default function HomePage() {
    const [quotes, setQuotes] = useState([]);
    const navigate = useNavigate();
    const { labels } = useLanguage();

    // Carica i preventivi all'avvio
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



    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{labels.homeTitle}</h1>

            <button
                className="mb-6 px-4 py-2 bg-blue-600 text-white rounded"
                onClick={() => navigate("/quote")}
            >
                {labels.newQuote}
            </button>

            <h2 className="text-xl font-semibold mb-2">{labels.existingQuotes}</h2>
            {quotes.length === 0 && <p>{labels.noQuotes}</p>}

            <ul>
                {quotes.map((q, index) => (
                    <li key={index}>
                        <button
                            className="text-left w-full mb-2 p-2 border rounded hover:bg-gray-700"
                            onClick={() =>
                                alert(
                                    `${labels.editPlaceholder} ${q.client || labels.unnamedQuote}`
                                )
                            }
                        >
                            {q.client || labels.unnamedQuote} - {q.quoteDate || labels.noDate}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
