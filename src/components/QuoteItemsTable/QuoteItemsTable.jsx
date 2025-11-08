import Decimal from "decimal.js";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import FormField from "../FormField/FormField";
import styles from "./QuoteItemsTable.module.css";

export default function QuoteItemsTable({ items, setItems }) {
    const { labels } = useLanguage();

    const initialRow = {
        source: "",
        description: "",
        SR: "",
        LA: "",
        VE: "",
        ME: "",
        quantity: "",
        price: "",
        total: "",
    };

    const [rows, setRows] = useState(items?.length ? [...items] : [initialRow]);

    const parseDecimal = (v) => {
        if (!v) return new Decimal(0);
        const norm = v.replace(",", ".").replace(/[^0-9.]/g, "");
        return norm === "" || norm === "." ? new Decimal(0) : new Decimal(norm);
    };

    const formatDecimal = (v) => {
        try {
            return parseDecimal(v).toFixed(2).replace(".", ",");
        } catch {
            return "0,00";
        }
    };

    const handleChange = (rowIndex, field, value) => {
        const newRows = [...rows];

        if (["source", "description"].includes(field)) newRows[rowIndex][field] = value;
        else if (["SR", "LA", "VE", "ME", "price"].includes(field)) newRows[rowIndex][field] = value;
        else if (field === "quantity") newRows[rowIndex][field] = value.replace(/\D/g, "");

        const price = parseDecimal(newRows[rowIndex].price);
        const qty = parseDecimal(newRows[rowIndex].quantity);
        newRows[rowIndex].total = price.mul(qty).toFixed(2);

        // Ensure last row is empty
        const cleaned = newRows.filter((r) =>
            Object.entries(r).some(([k, v]) => {
                if (k === "total") return false;
                if (["SR", "LA", "VE", "ME", "price", "quantity"].includes(k)) return parseDecimal(v).gt(0);
                return v.trim() !== "";
            })
        );

        if (!cleaned.length || cleaned[cleaned.length - 1] !== initialRow) cleaned.push({ ...initialRow });

        setRows(cleaned);
    };

    const refs = useRef([]);
    refs.current = [];
    const addToRefs = (el) => el && refs.current.push(el);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            let index = refs.current.indexOf(e.target);
            let next = index + 1;
            while (refs.current[next] && refs.current[next].readOnly) next++;
            if (refs.current[next]) refs.current[next].focus();
        }
    };

    const columns = [
        { key: "source", label: labels.source },
        { key: "description", label: labels.description },
        { key: "SR", label: "SR" },
        { key: "LA", label: "LA" },
        { key: "VE", label: "VE" },
        { key: "ME", label: "ME" },
        { key: "quantity", label: labels.quantity },
        { key: "price", label: labels.price },
        { key: "total", label: labels.total },
    ];

    const columnTotals = { SR: "0,00", LA: "0,00", VE: "0,00", ME: "0,00", price: "0,00", total: "0,00" };
    rows.forEach((row) => {
        ["SR", "LA", "VE", "ME", "price", "total"].forEach((f) => {
            columnTotals[f] = parseDecimal(columnTotals[f])
                .plus(parseDecimal(row[f]))
                .toFixed(2)
                .replace(".", ",");
        });
    });

    useEffect(() => {
        const filtered = rows
            .filter((r) =>
                Object.entries(r).some(([k, v]) => {
                    if (k === "total") return false;
                    if (["quantity", "price", "SR", "LA", "VE", "ME"].includes(k)) return parseDecimal(v).gt(0);
                    return v.trim() !== "";
                })
            )
            .map((r) => ({ ...r, total: parseDecimal(r.price).mul(parseDecimal(r.quantity)).toFixed(2) }));

        setItems(filtered);
    }, [rows, setItems]);

    return (
        <div className={styles.container}>
            {rows.map((row, rowIndex) => (
                <div
                    key={rowIndex}
                    className={`${styles.row} ${rowIndex % 2 === 0 ? styles.rowEven : styles.rowOdd}`}
                >
                    <div className={styles.rowHeader}>
                        <span className={styles.rowNumber}>{rowIndex + 1}</span>
                    </div>

                    {columns.map((col) => {
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
                                    onChange={(val) => handleChange(rowIndex, col.key, val)}
                                    type={col.key === "quantity" ? "number" : "text"}
                                    symbol={isCurrency ? "€" : undefined}
                                    onEnter={handleKeyDown}
                                    readOnly={isReadOnly}
                                />
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* SUMMARY CARD */}
            <div className={styles.summaryCard}>
                <h4 className={styles.summaryTitle}>{labels.totals}</h4>
                <div className={styles.summaryGrid}>
                    <span>{labels.total_labor_hours}</span>
                    {["SR", "LA", "VE", "ME"].map((f) => (
                        <span key={f}>{f}: {columnTotals[f]}</span>
                    ))}
                    <span>{labels.price}: {columnTotals.price} €</span>
                    <span>{labels.total}: {columnTotals.total} €</span>
                </div>
            </div>
        </div>
    );
}
