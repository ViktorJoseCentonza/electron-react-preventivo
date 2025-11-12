import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export function SearchProvider({ children }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);

    const handleSearch = async (q) => {
        setQuery(q);

        if (!q) {
            setResults([]);
            return;
        }

        try {
            const res = await window.api.quotes.search(q);
            if (res?.ok) {
                setResults(res.matches || []);
            } else {
                console.error(res?.error || "quotes:search returned not ok");
                setResults([]);
            }
        } catch (err) {
            console.error("Search failed:", err);
            setResults([]);
        }
    };

    return (
        <SearchContext.Provider value={{ query, results, handleSearch }}>
            {children}
        </SearchContext.Provider>
    );
}

export const useSearch = () => useContext(SearchContext);
