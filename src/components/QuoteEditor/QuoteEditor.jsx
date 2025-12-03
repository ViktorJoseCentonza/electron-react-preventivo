import { useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useQuoteData } from "../../contexts/QuoteDataContext";
import FormField from "../FormField/FormField";
import styles from "./QuoteEditor.module.css";

const generalFields = [
    { key: "client", type: "text", maxLength: 50 },
    { key: "licensePlate", type: "text", maxLength: 7, style: { textTransform: "uppercase" } },
    { key: "model", type: "text", maxLength: 50 },
    { key: "year", type: "text", maxLength: 4 },
    { key: "chassis", type: "text", maxLength: 17 },
    { key: "insurance", type: "text", maxLength: 50 },
];

const EMPTY_ITEM = {
    source: "",
    description: "",
    SR: 0,
    LA: 0,
    VE: 0,
    ME: 0,
    quantity: 0,
    price: 0,
    total: 0,
};


const normalizeCommaToDot = (value) => {
    if (typeof value === "string") {
        const normalizedValue = value.replace(",", ".");
        const parsedValue = parseFloat(normalizedValue);


        if (isNaN(parsedValue)) {
            return 0;
        }
        return normalizedValue;
    }
    return value;
};

const isItemEmpty = (row) => {
    if (!row) return true;
    const textEmpty =
        (row.source ?? "").toString().trim() === "" &&
        (row.description ?? "").toString().trim() === "";
    const nums = ["SR", "LA", "VE", "ME", "quantity", "price"].map((k) => Number(row[k] || 0));
    const allZero = nums.every((n) => !n || n === 0);
    return textEmpty && allZero;
};

export default function QuoteEditor() {
    const { labels } = useLanguage();
    const { quote, update } = useQuoteData();

    useEffect(() => { }, [quote]);

    const today = new Date().toISOString().split("T")[0];

    const handleGeneralChange = (key, value) => {
        update(`general.${key}`, value);
    };

    const handleItemChange = (idx, key, value) => {

        const normalizedValue = ["SR", "LA", "VE", "ME", "quantity", "price"].includes(key)
            ? normalizeCommaToDot(value)
            : value;
        update(`items[${idx}].${key}`, normalizedValue);
    };

    const handleRowBlur = (idx) => {
        const items = quote.items ?? [];
        const row = items[idx];
        if (!row) return;
        if (isItemEmpty(row)) {
            const next = items.filter((_, i) => i !== idx);
            update("items", next);
        }
    };

    const handleGhostChange = (key, value) => {

        const normalizedValue = ["SR", "LA", "VE", "ME", "quantity", "price"].includes(key)
            ? normalizeCommaToDot(value)
            : value;
        const newItem = { ...EMPTY_ITEM, [key]: normalizedValue };
        const nextItems = [...(quote.items ?? []), newItem];
        update("items", nextItems);
    };

    const savedItems = quote.items ?? [];
    const rowsToRender = [...savedItems, { __ghost: true }];

    return (
        <div className={styles.container}>
            { }
            <div className={styles.generalSection}>
                {generalFields.map(({ key, type, maxLength, style }) => (
                    <FormField
                        key={key}
                        label={labels[key]}
                        value={quote.general[key] || ""}
                        type={type}
                        maxLength={maxLength}
                        style={style}
                        onChange={(v) => handleGeneralChange(key, v)}
                    />
                ))}

                { }
                <FormField
                    key="quoteDate"
                    wrapperClassName={styles.fullRow}
                    label={labels.quoteDate}
                    type="date"
                    value={quote.general.quoteDate || today}
                    onChange={(v) => handleGeneralChange("quoteDate", v)}
                />
            </div>

            { }
            <div className={styles.itemsSection}>
                <h2 className={styles.sectionTitle}>{labels.section_items}</h2>

                <div className={`${styles.itemRow} ${styles.itemHeader}`}>
                    <div className={styles.headerCell}>{labels.source}</div>
                    <div className={styles.headerCell}>{labels.description}</div>
                    <div className={styles.headerCell}>{labels.SR}</div>
                    <div className={styles.headerCell}>{labels.LA}</div>
                    <div className={styles.headerCell}>{labels.VE}</div>
                    <div className={styles.headerCell}>{labels.ME}</div>
                    <div className={styles.headerCell}>{labels.quantity}</div>
                    <div className={styles.headerCell}>{labels.price}</div>
                    <div className={styles.headerCell}>{labels.total}</div>
                </div>

                {rowsToRender.map((row, idx) => {
                    const isGhost = row.__ghost === true;
                    const onChangeFor = (fieldKey) => (v) =>
                        isGhost ? handleGhostChange(fieldKey, v) : handleItemChange(idx, fieldKey, v);

                    const totalValue = isGhost ? "" : (row.total ?? 0).toFixed(2);

                    return (
                        <div key={idx} className={styles.itemRow}>
                            <FormField
                                label={null}
                                value={isGhost ? "" : row.source ?? ""}
                                onChange={onChangeFor("source")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                value={isGhost ? "" : row.description ?? ""}
                                onChange={onChangeFor("description")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                type="number"
                                value={isGhost ? "" : row.SR ?? 0}
                                onChange={onChangeFor("SR")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                type="number"
                                value={isGhost ? "" : row.LA ?? 0}
                                onChange={onChangeFor("LA")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                type="number"
                                value={isGhost ? "" : row.VE ?? 0}
                                onChange={onChangeFor("VE")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                type="number"
                                value={isGhost ? "" : row.ME ?? 0}
                                onChange={onChangeFor("ME")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                type="number"
                                value={isGhost ? "" : row.quantity ?? 0}
                                onChange={onChangeFor("quantity")}
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            <FormField
                                label={null}
                                type="number"
                                value={isGhost ? "" : row.price ?? 0}
                                onChange={onChangeFor("price")}
                                symbol="€"
                                inputProps={!isGhost ? { onBlur: () => handleRowBlur(idx) } : undefined}
                            />
                            { }
                            <FormField label={null} readOnly value={totalValue} symbol="€" skipTab />
                        </div>
                    );
                })}
            </div>

            { }
            <div className={styles.complementarySection}>
                <h2 className={styles.sectionTitle}>{labels.section_complementary}</h2>

                <div className={`${styles.compRow} ${styles.compHeader}`}>
                    <div className={styles.compTitleCell}></div>
                    <div className={styles.headerCell}>{labels.quantity}</div>
                    <div className={styles.headerCell}>{labels.price}</div>
                    <div className={styles.headerCell}>{labels.iva_percentage}</div>
                    <div className={styles.headerCell}>{labels.total}</div>
                    <div className={styles.headerCell}>{labels.imponibile}</div>
                    <div className={styles.headerCell}>{labels.imposta}</div>
                    <div className={styles.headerCell}>{labels.total_with_iva}</div>
                </div>

                { }
                <div className={styles.compRow}>
                    <div className={styles.compTitleCell}><h3>{labels.parts_total}</h3></div>
                    <div className={styles.placeholder} aria-hidden="true"></div>
                    <div className={styles.placeholder} aria-hidden="true"></div>
                    { }
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.partsTotal.tax ?? 22}
                        onChange={(v) => update("complementary.partsTotal.tax", v)}
                        skipTab
                    />
                    { }
                    <FormField label={null} readOnly value={(quote.complementary.partsTotal.total || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.partsTotal.taxable || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.partsTotal.taxAmount || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.partsTotal.totalWithTax || 0).toFixed(2)} symbol="€" skipTab />
                </div>

                { }
                <div className={styles.compRow}>
                    <div className={styles.compTitleCell}><h3>{labels.comp_voci}</h3></div>
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.parts.quantity ?? 0}
                        onChange={(v) => update("complementary.parts.quantity", v)}
                    />
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.parts.price ?? 0}
                        onChange={(v) => update("complementary.parts.price", v)}
                        symbol="€"
                    />
                    { }
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.parts.tax ?? 22}
                        onChange={(v) => update("complementary.parts.tax", v)}
                        skipTab
                    />
                    { }
                    <FormField label={null} readOnly value={(quote.complementary.parts.total || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.parts.taxable || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.parts.taxAmount || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.parts.totalWithTax || 0).toFixed(2)} symbol="€" skipTab />
                </div>

                { }
                <div className={styles.compRow}>
                    <div className={styles.compTitleCell}><h3>{labels.comp_carrozzeria}</h3></div>
                    <FormField label={null} type="number" value={quote.complementary.bodywork.quantity ?? 0} readOnly skipTab />
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.bodywork.price ?? 40}
                        onChange={(v) => update("complementary.bodywork.price", v)}
                        symbol="€"
                    />
                    { }
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.bodywork.tax ?? 22}
                        onChange={(v) => update("complementary.bodywork.tax", v)}
                        skipTab
                    />
                    <FormField label={null} readOnly value={(quote.complementary.bodywork.total || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.bodywork.taxable || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.bodywork.taxAmount || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.bodywork.totalWithTax || 0).toFixed(2)} symbol="€" skipTab />
                </div>

                { }
                <div className={styles.compRow}>
                    <div className={styles.compTitleCell}><h3>{labels.comp_meccanica}</h3></div>
                    <FormField label={null} type="number" value={quote.complementary.mechanics.quantity ?? 0} readOnly skipTab />
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.mechanics.price ?? 40}
                        onChange={(v) => update("complementary.mechanics.price", v)}
                        symbol="€"
                    />
                    { }
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.mechanics.tax ?? 22}
                        onChange={(v) => update("complementary.mechanics.tax", v)}
                        skipTab
                    />
                    <FormField label={null} readOnly value={(quote.complementary.mechanics.total || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.mechanics.taxable || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.mechanics.taxAmount || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.mechanics.totalWithTax || 0).toFixed(2)} symbol="€" skipTab />
                </div>

                { }
                <div className={styles.compRow}>
                    <div className={styles.compTitleCell}><h3>{labels.comp_consumo}</h3></div>
                    <FormField label={null} type="number" value={quote.complementary.consumables.quantity ?? 0} readOnly skipTab />
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.consumables.price ?? 24}
                        onChange={(v) => update("complementary.consumables.price", v)}
                        symbol="€"
                    />
                    { }
                    <FormField
                        label={null}
                        type="number"
                        value={quote.complementary.consumables.tax ?? 22}
                        onChange={(v) => update("complementary.consumables.tax", v)}
                        skipTab
                    />
                    <FormField label={null} readOnly value={(quote.complementary.consumables.total || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.consumables.taxable || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.consumables.taxAmount || 0).toFixed(2)} symbol="€" skipTab />
                    <FormField label={null} readOnly value={(quote.complementary.consumables.totalWithTax || 0).toFixed(2)} symbol="€" skipTab />
                </div>
            </div>

            { }
            <div className={styles.finalTotals}>
                <FormField label={labels.total_no_vat} readOnly value={(quote.totals.subtotal || 0).toFixed(2)} symbol="€" skipTab />
                <FormField label={labels.total_vat_amount} readOnly value={(quote.totals.iva || 0).toFixed(2)} symbol="€" skipTab />
                <FormField label={labels.total_with_iva} readOnly value={(quote.totals.totalWithIva || 0).toFixed(2)} symbol="€" skipTab />
            </div>
        </div>
    );
}
