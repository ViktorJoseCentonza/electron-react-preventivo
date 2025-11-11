import { createContext, useCallback, useContext, useState } from "react";
import { recalculateQuote } from "./quoteUtils";

const QuoteDataContext = createContext(null);

// expose defaults so pages can build fresh state correctly
export const defaultQuote = {
    general: {
        client: "",
        licensePlate: "",
        model: "",
        year: "",
        chassis: "",
        insurance: "",
        quoteDate: new Date().toISOString().split("T")[0],
    },
    items: [], // ghost row is UI-only
    complementary: {
        parts: { quantity: 0, price: 0, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 },
        bodywork: { quantity: 0, price: 40, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 },
        mechanics: { quantity: 0, price: 40, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 },
        consumables: { quantity: 0, price: 24, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 },
        partsTotal: { total: 0, taxable: 0, tax: 22, taxAmount: 0, totalWithTax: 0 },
    },
    totals: { subtotal: 0, iva: 0, totalWithIva: 0 },
};

export function QuoteDataProvider({ children }) {
    const [quote, setQuote] = useState(defaultQuote);

    const setByPath = (obj, path, value) => {
        const parts = path.replace(/\]/g, "").split(/\.|\[/);
        let ref = obj;
        for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            const nextKey = parts[i + 1];
            const isNextIndex = /^\d+$/.test(nextKey);
            if (!(key in ref) || ref[key] == null) ref[key] = isNextIndex ? [] : {};
            ref = ref[key];
        }
        ref[parts[parts.length - 1]] = value;
    };

    const deepClone = (x) => JSON.parse(JSON.stringify(x));

    const update = useCallback((path, value) => {
        setQuote((prev) => {
            const next = deepClone(prev);
            setByPath(next, path, value);
            recalculateQuote(next);
            return next;
        });
    }, []);

    const setQuoteDirect = useCallback((next) => {
        const cloned = deepClone(next);
        recalculateQuote(cloned);
        setQuote(cloned);
    }, []);

    const resetQuote = useCallback(() => {
        const base = deepClone(defaultQuote);
        recalculateQuote(base);
        setQuote(base);
    }, []);

    return (
        <QuoteDataContext.Provider value={{ quote, update, setQuoteDirect, resetQuote }}>
            {children}
        </QuoteDataContext.Provider>
    );
}

export const useQuoteData = () => useContext(QuoteDataContext);
