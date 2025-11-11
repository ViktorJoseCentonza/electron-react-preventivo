import { createContext, useContext, useState } from "react";

const QuoteStateContext = createContext();

export function QuoteStateProvider({ children }) {
    const [isDirty, setIsDirty] = useState(false);
    const [lastSavedFile, setLastSavedFile] = useState(null);

    const markDirty = () => setIsDirty(true);
    const markSaved = (file) => {
        setIsDirty(false);
        setLastSavedFile(file);
    };

    return (
        <QuoteStateContext.Provider
            value={{ isDirty, lastSavedFile, markDirty, markSaved }}
        >
            {children}
        </QuoteStateContext.Provider>
    );
}

export const useQuoteState = () => useContext(QuoteStateContext);
