import Decimal from "decimal.js";
import { useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuote } from "../../contexts/QuoteContext";
import FormField from "../FormField/FormField";
import styles from "./QuoteItemsTable.module.css";

export default function QuoteItemsTable() {
    const { labels } = useLanguage();
    const { items, setItems, setAutoTotals } = useQuote();

    const refs = useRef([]);
    refs.current = [];
    const addToRefs = (el) => el && refs.current.push(el);

    const parseDecimal = (v) => {
        if (v == null) return new Decimal(0);
        if (typeof v === "number") return new Decimal(v);
        const s = String(v).trim().replace(",", ".");
        const norm = s.replace(/[^0-9.]/g, "");
        return norm === "" || norm === "." ? new Decimal(0) : new Decimal(norm);
    };

    const formatDecimal = (v) => parseDecimal(v).toFixed(2).replace(".", ",");

    const handleChange = (rowIndex, field, value) => {
        const newItems = [...items];

        // Create new row if doesn't exist
        if (!newItems[rowIndex]) {
            newItems[rowIndex] = { source: "", description: "", SR: "", LA: "", VE: "", ME: "", quantity: "", price: "", total: "" };
        }

        newItems[rowIndex] = { ...newItems[rowIndex], [field]: value };

        // Calculate total (quantity * price)
        const price = parseDecimal(newItems[rowIndex].price);
        const qty = parseDecimal(newItems[rowIndex].quantity);
        newItems[rowIndex].total = price.mul(qty).toFixed(2);

        // Remove completely empty rows except last
        const cleaned = newItems.filter((r, i) => {
            if (i === newItems.length - 1) return true;
            return Object.entries(r).some(([k, v]) => {
                if (k === "total") return false;
                return ["SR", "LA", "VE", "ME", "quantity", "price"].includes(k) ? parseDecimal(v).gt(0) : v.trim() !== "";
            });
        });

        setItems(cleaned);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            let index = refs.current.indexOf(e.target);
            let next = index + 1;
            while (refs.current[next] && refs.current[next].readOnly) next++;
            if (refs.current[next]) refs.current[next].focus();
        }
    };

    // Update autoTotals based on items
    useEffect(() => {
        const totals = items.reduce(
            (acc, r) => {
                acc.SR = parseDecimal(acc.SR).plus(parseDecimal(r.SR)).toNumber();
                acc.LA = parseDecimal(acc.LA).plus(parseDecimal(r.LA)).toNumber();
                acc.VE = parseDecimal(acc.VE).plus(parseDecimal(r.VE)).toNumber();
                acc.ME = parseDecimal(acc.ME).plus(parseDecimal(r.ME)).toNumber();
                return acc;
            },
            { SR: 0, LA: 0, VE: 0, ME: 0 }
        );

        // VE counts twice: for bodywork and consumables
        setAutoTotals({
            bodywork: totals.SR + totals.LA + totals.VE,
            mechanics: totals.ME,
            consumables: totals.VE
        });
    }, [items, setAutoTotals]);

    const columns = [
        { key: "source", label: labels.source },
        { key: "description", label: labels.description },
        { key: "SR", label: labels.SR },
        { key: "LA", label: labels.LA },
        { key: "VE", label: labels.VE },
        { key: "ME", label: labels.ME },
        { key: "quantity", label: labels.quantity },
        { key: "price", label: labels.price },
        { key: "total", label: labels.total }
    ];

    const renderRows = [...items, { source: "", description: "", SR: "", LA: "", VE: "", ME: "", quantity: "", price: "", total: "" }];

    return (
        <div className={styles.container}>
            {renderRows.map((row, rowIndex) => (
                <div key={rowIndex} className={`${styles.row} ${rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}`}>
                    <div className={styles.rowHeader}><span className={styles.rowNumber}>{rowIndex + 1}</span></div>
                    {columns.map(col => {
                        const isCurrency = ["price", "total"].includes(col.key);
                        const isReadOnly = col.key === "total";
                        const value = isReadOnly ? formatDecimal(row[col.key]) : row[col.key];

                        return (
                            <div key={col.key} className={styles.inputWrapper}>
                                <span className={styles.label}>{col.label}</span>
                                <FormField
                                    ref={addToRefs}
                                    label=""
                                    value={value}
                                    type={col.key === "quantity" || col.key === "price" ? "number" : "text"}
                                    symbol={isCurrency ? "€" : undefined}
                                    onChange={val => handleChange(rowIndex, col.key, val)}
                                    onEnter={handleKeyDown}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
