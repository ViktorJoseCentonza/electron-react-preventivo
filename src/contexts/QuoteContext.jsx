import Decimal from "decimal.js";
import { createContext, useContext, useMemo, useState } from "react";

const QuoteContext = createContext();

export function QuoteProvider({ children }) {
    const defaultQuote = {
        client: "",
        licensePlate: "",
        model: "",
        year: "",
        chassis: "",
        insurance: "",
        quoteDate: "",
    };

    const resetQuote = () => {
        setQuote({ ...defaultQuote });
        setItems([]);
        setComplementaryItems({
            parts: { quantity: "0", price: "0", tax: "22" },
            bodywork: { quantity: "0", price: "40", tax: "22" },
            mechanics: { quantity: "0", price: "40", tax: "22" },
            consumables: { quantity: "0", price: "24", tax: "22" },
            final: { tax: "22" },
        });

        setAutoTotals({
            bodywork: 0,
            mechanics: 0,
            consumables: 0,
        });
    };


    const [quote, setQuote] = useState({ ...defaultQuote });
    const [items, setItems] = useState([]);
    const [complementaryItems, setComplementaryItems] = useState({
        parts: { quantity: "0", price: "0", tax: "22" },
        bodywork: { quantity: "0", price: "40", tax: "22" },
        mechanics: { quantity: "0", price: "40", tax: "22" },
        consumables: { quantity: "0", price: "24", tax: "22" },
        final: { tax: "22" }, // editable IVA for the total
    });

    const [autoTotals, setAutoTotals] = useState({
        bodywork: 0,
        mechanics: 0,
        consumables: 0,
    });

    const updateQuoteField = (field, value) => {
        setQuote(prev => ({ ...prev, [field]: value }));
    };

    const updateComplementaryField = (group, field, value) => {
        setComplementaryItems(prev => ({
            ...prev,
            [group]: {
                ...prev[group],
                [field]: value
            }
        }));
    };

    // Totals for each complementary group (excluding items table)
    const groupTotals = useMemo(() => {
        const parseDecimal = v => new Decimal(v || 0);
        const groups = ["parts", "bodywork", "mechanics", "consumables"];
        const totals = {};

        groups.forEach(g => {
            const row = complementaryItems[g] || { quantity: 0, price: 0 };
            totals[g] = parseDecimal(row.quantity).mul(parseDecimal(row.price)).toNumber();
        });

        return totals;
    }, [complementaryItems]);

    // Totale ricambi = sum of all items table
    const partsTotal = useMemo(() => {
        return items.reduce((acc, item) => {
            const qty = new Decimal(item.quantity || 0);
            const price = new Decimal(item.price || 0);
            return acc.plus(qty.mul(price));
        }, new Decimal(0)).toNumber();
    }, [items]);

    // Final totals including all complementary groups + items table
    const finalTotals = useMemo(() => {
        const sum = ["parts", "bodywork", "mechanics", "consumables"]
            .reduce((acc, g) => acc.plus(new Decimal(groupTotals[g] || 0)), new Decimal(0))
            .plus(new Decimal(partsTotal)); // include parts total

        const taxRate = new Decimal(complementaryItems.final?.tax || 22);
        const taxAmount = sum.mul(taxRate).div(100);
        const totalWithTax = sum.plus(taxAmount);

        return {
            subtotal: sum.toNumber(),
            taxRate: taxRate.toNumber(),
            taxAmount: taxAmount.toNumber(),
            total: totalWithTax.toNumber()
        };
    }, [groupTotals, complementaryItems.final?.tax, partsTotal]);

    return (
        <QuoteContext.Provider value={{
            quote,
            updateQuoteField,
            items,
            setItems,
            complementaryItems,
            updateComplementaryField,
            groupTotals,
            finalTotals,
            autoTotals,
            setAutoTotals,
            partsTotal,
            resetQuote
        }}>
            {children}
        </QuoteContext.Provider>
    );
}

export const useQuote = () => useContext(QuoteContext);
