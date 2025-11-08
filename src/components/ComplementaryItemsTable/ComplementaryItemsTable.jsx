import Decimal from "decimal.js";
import { useMemo } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuote } from "../../contexts/QuoteContext";
import FormField from "../FormField/FormField";
import styles from "./ComplementaryItemsTable.module.css";

export default function ComplementaryItemsTable() {
    const { labels } = useLanguage();
    const { complementaryItems, updateComplementaryField, autoTotals, partsTotal } = useQuote();

    const parseDecimal = (v) => {
        if (v == null) return new Decimal(0);
        if (typeof v === "number") return new Decimal(v);
        const s = String(v).trim().replace(",", ".");
        const norm = s.replace(/[^0-9.]/g, "");
        return norm === "" || norm === "." ? new Decimal(0) : new Decimal(norm);
    };

    const formatDecimal = (v) => parseDecimal(v).toFixed(2).replace(".", ",");

    const defaultPrices = { parts: "0", bodywork: "40", mechanics: "40", consumables: "24" };

    const safeGroup = (group) => {
        const autoQuantity =
            group === "bodywork" ? autoTotals.bodywork :
                group === "mechanics" ? autoTotals.mechanics :
                    group === "consumables" ? autoTotals.consumables : undefined;

        return {
            quantity: autoQuantity ?? complementaryItems[group]?.quantity ?? "0",
            price: complementaryItems[group]?.price ?? defaultPrices[group] ?? "0",
            tax: complementaryItems[group]?.tax ?? "22",
            readOnly: !!autoQuantity,
        };
    };

    const calculate = (group) => {
        const row = safeGroup(group);
        const q = parseDecimal(row.quantity);
        const p = parseDecimal(row.price);
        const tax = parseDecimal(row.tax);
        const total = q.mul(p);
        const taxAmount = total.mul(tax).div(100);
        const totalWithTax = total.plus(taxAmount);
        return {
            total: total.toFixed(2),
            taxable: total.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            totalWithTax: totalWithTax.toFixed(2),
            tax: row.tax
        };
    };

    const partsCalc = useMemo(() => {
        const tax = complementaryItems.parts?.tax ?? "22";
        const taxAmount = partsTotal * (tax / 100);
        const totalWithTax = partsTotal + taxAmount;
        return {
            total: partsTotal.toFixed(2),
            taxable: partsTotal.toFixed(2),
            tax,
            taxAmount: taxAmount.toFixed(2),
            totalWithTax: totalWithTax.toFixed(2)
        };
    }, [partsTotal, complementaryItems.parts?.tax]);

    const groupMap = [
        { key: "partsTotal", label: labels.parts_total },
        { key: "parts", label: labels.comp_voci },
        { key: "bodywork", label: labels.comp_carrozzeria },
        { key: "mechanics", label: labels.comp_meccanica },
        { key: "consumables", label: labels.comp_consumo },
        { key: "final", label: labels.final_total },
    ];

    // Final quote totals
    const finalTotals = useMemo(() => {
        const groups = ["parts", "bodywork", "mechanics", "consumables"];

        const totalNoVAT = groups.reduce((acc, g) => acc.plus(parseDecimal(calculate(g).taxable)), new Decimal(0))
            .plus(parseDecimal(partsCalc.taxable));

        const totalVAT = groups.reduce((acc, g) => acc.plus(parseDecimal(calculate(g).taxAmount)), new Decimal(0))
            .plus(parseDecimal(partsCalc.taxAmount));

        const totalWithVAT = groups.reduce((acc, g) => acc.plus(parseDecimal(calculate(g).totalWithTax)), new Decimal(0))
            .plus(parseDecimal(partsCalc.totalWithTax));

        return {
            totalNoVAT,
            totalVAT,
            totalWithVAT
        };
    }, [complementaryItems, autoTotals, partsCalc]);

    return (
        <div className={styles.wrapper}>
            {groupMap.map((g) => {
                const isFinal = g.key === "final";
                const isPartsTotal = g.key === "partsTotal";
                const calc = isFinal
                    ? null
                    : isPartsTotal
                        ? partsCalc
                        : calculate(g.key);
                const row = isPartsTotal || isFinal ? {} : safeGroup(g.key);

                return (
                    <div key={g.key} className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}>{g.label}</h3>
                        <div className={styles.row}>
                            {!isFinal ? (
                                <>
                                    {isPartsTotal ? (
                                        <>
                                            <div className={styles.inputWrapper}></div>
                                            <div className={styles.inputWrapper}></div>
                                        </>
                                    ) : (
                                        <>
                                            <FormField
                                                label={labels.quantity}
                                                value={row.quantity}
                                                type="number"
                                                readOnly={row.readOnly}
                                                onChange={(v) => updateComplementaryField(g.key, "quantity", v)}
                                            />
                                            <FormField
                                                label={labels.price}
                                                value={row.price}
                                                type="number"
                                                readOnly={row.readOnly}
                                                onChange={(v) => updateComplementaryField(g.key, "price", v)}
                                                symbol="€"
                                            />
                                        </>
                                    )}
                                    <FormField
                                        label={labels.total}
                                        value={formatDecimal(calc.total)}
                                        readOnly
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.imponibile}
                                        value={formatDecimal(calc.taxable)}
                                        readOnly
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.iva_percentage}
                                        value={calc.tax ?? "22"}
                                        type="number"
                                        onChange={(v) => {
                                            if (isPartsTotal) {
                                                updateComplementaryField("parts", "tax", v);
                                            } else {
                                                updateComplementaryField(g.key, "tax", v);
                                            }
                                        }}
                                    />
                                    <FormField
                                        label={labels.imposta}
                                        value={formatDecimal(calc.taxAmount)}
                                        readOnly
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.total_with_iva}
                                        value={formatDecimal(calc.totalWithTax)}
                                        readOnly
                                        symbol="€"
                                    />
                                </>
                            ) : (
                                <>
                                    <div className={styles.inputWrapper}></div>
                                    <div className={styles.inputWrapper}></div>
                                    <div className={styles.inputWrapper}></div>
                                    <div className={styles.inputWrapper}></div>

                                    {/* FINAL TOTAL */}
                                    <FormField
                                        label={labels.total_no_vat}
                                        value={formatDecimal(finalTotals.totalNoVAT)}
                                        readOnly
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.total_vat_amount}
                                        value={formatDecimal(finalTotals.totalVAT)}
                                        readOnly
                                        symbol="€"
                                    />
                                    <FormField
                                        label={labels.total_with_iva}
                                        value={formatDecimal(finalTotals.totalWithVAT)}
                                        readOnly
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
