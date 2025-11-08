import Decimal from "decimal.js";
import { useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import FormField from "../FormField/FormField";
import styles from "./ComplementaryItemsTable.module.css";

export default function ComplementaryItemsTable({ values, onChange }) {
    const { labels } = useLanguage();

    const initialRow = () => ({
        quantity: "",
        price: "",
        iva: "22",
    });

    const [rows, setRows] = useState(
        values || {
            voci: initialRow(),
            carrozzeria: initialRow(),
            meccanica: initialRow(),
            consumo: initialRow(),
            final: initialRow(), // final summary row
        }
    );

    /* ------------------ Helpers ------------------ */
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

    const handleChange = (group, field, value) => {
        const newRows = { ...rows };
        newRows[group][field] = value;
        setRows(newRows);
        onChange?.(newRows);
    };

    const handleBlurDecimal = (group, field) => {
        const newRows = { ...rows };
        newRows[group][field] = formatDecimal(newRows[group][field]);
        setRows(newRows);
        onChange?.(newRows);
    };

    const calculate = (group) => {
        const q = parseDecimal(rows[group].quantity);
        const p = parseDecimal(rows[group].price);
        const iva = parseDecimal(rows[group].iva);

        const total = q.mul(p);
        const imponibile = total;
        const imposta = imponibile.mul(iva).div(100);
        const totaleIvato = imponibile.plus(imposta);

        return {
            total: total.toFixed(2),
            imponibile: imponibile.toFixed(2),
            imposta: imposta.toFixed(2),
            totaleIvato: totaleIvato.toFixed(2),
        };
    };

    /* ------------------ Keyboard navigation ------------------ */
    const refs = useRef([]);
    refs.current = [];
    const addToRefs = (el) => el && refs.current.push(el);
    const handleKeyDown = (e, index) => {
        if (e.key === "Tab" && !e.shiftKey) {
            let next = index + 1;
            while (refs.current[next] && refs.current[next].readOnly) next++;
            if (refs.current[next]) {
                e.preventDefault();
                refs.current[next].focus();
            }
        }
    };

    /* ------------------ Groups ------------------ */
    const groups = [
        { key: "voci", label: labels.comp_voci },
        { key: "carrozzeria", label: labels.comp_carrozzeria },
        { key: "meccanica", label: labels.comp_meccanica },
        { key: "consumo", label: labels.comp_consumo },
        { key: "final", label: labels.final_total },
    ];

    /* ------------------ Compute final totals ------------------ */
    const sumImponibile = ["voci", "carrozzeria", "meccanica", "consumo"].reduce(
        (acc, g) => acc.plus(parseDecimal(calculate(g).imponibile)),
        new Decimal(0)
    );

    const finalCalc = (() => {
        const iva = parseDecimal(rows.final.iva);
        const imponibile = sumImponibile;
        const imposta = imponibile.mul(iva).div(100);
        const totaleIvato = imponibile.plus(imposta);
        return {
            total: "0.00", // skipped
            imponibile: imponibile.toFixed(2),
            imposta: imposta.toFixed(2),
            totaleIvato: totaleIvato.toFixed(2),
        };
    })();

    return (
        <div className={styles.wrapper}>
            {groups.map((g) => {
                const calc = g.key === "final" ? finalCalc : calculate(g.key);

                return (
                    <div key={g.key} className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}>{g.label}</h3>
                        <div className={g.key !== "final" ? styles.row : `${styles.row} ${styles.finalRow}`}>
                            {g.key !== "final" ? (
                                <>
                                    <FormField
                                        ref={addToRefs}
                                        label={labels.quantity}
                                        type="number"
                                        value={rows[g.key].quantity}
                                        onChange={(v) => handleChange(g.key, "quantity", v)}
                                    />
                                    <FormField
                                        ref={addToRefs}
                                        label={labels.price}
                                        type="number"
                                        value={rows[g.key].price}
                                        onChange={(v) => handleChange(g.key, "price", v)}
                                        onEnter={() => handleBlurDecimal(g.key, "price")}
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.total}
                                        type="text"
                                        value={calc.total}
                                        onChange={() => { }}
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.imponibile}
                                        type="text"
                                        value={calc.imponibile}
                                        onChange={() => { }}
                                        symbol="€"
                                    />
                                    <FormField
                                        ref={addToRefs}
                                        label={labels.iva_percentage}
                                        type="number"
                                        value={rows[g.key].iva}
                                        onChange={(v) => handleChange(g.key, "iva", v)}
                                    />
                                    <FormField
                                        label={labels.imposta}
                                        type="text"
                                        value={calc.imposta}
                                        onChange={() => { }}
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.total_with_iva}
                                        type="text"
                                        value={calc.totaleIvato}
                                        onChange={() => { }}
                                        symbol="€"
                                    />
                                </>
                            ) : (
                                <>
                                    {[...Array(4)].map((_, idx) => (
                                        <div key={`empty-${idx}`} className={styles.inputWrapper}></div>
                                    ))}
                                    <FormField
                                        ref={addToRefs}
                                        label={labels.iva_percentage}
                                        type="number"
                                        value={rows.final.iva}
                                        onChange={(v) => handleChange("final", "iva", v)}
                                    />
                                    <FormField
                                        label={labels.imposta}
                                        type="text"
                                        value={finalCalc.imposta}
                                        onChange={() => { }}
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.total_with_iva}
                                        type="text"
                                        value={finalCalc.totaleIvato}
                                        onChange={() => { }}
                                        symbol="€"
                                    />
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
