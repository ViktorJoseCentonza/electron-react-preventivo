import { useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import FormField from "../FormField/FormField";
import styles from "./QuoteGeneralFields.module.css";

export default function QuoteGeneralFields({ quote, update }) {
    const { labels } = useLanguage();

    const clientRef = useRef(null);
    const licensePlateRef = useRef(null);
    const modelRef = useRef(null);
    const yearRef = useRef(null);
    const chassisRef = useRef(null);
    const insuranceRef = useRef(null);
    const quoteDateRef = useRef(null);

    const today = new Date().toISOString().split("T")[0];

    const getFieldProps = (labelKey) => {
        switch (labelKey) {
            case labels.client:
                return { type: "text", maxLength: 50 };
            case labels.licensePlate:
                return { type: "text", maxLength: 7, style: { textTransform: "uppercase" } };
            case labels.model:
                return { type: "text", maxLength: 50 };
            case labels.year:
                return { type: "number", min: 1900, max: 2100, inputMode: "numeric" };
            case labels.chassis:
                return { type: "text", maxLength: 17 };
            case labels.insurance:
                return { type: "text", maxLength: 50 };
            case labels.quoteDate:
                return { type: "date" };
            default:
                return { type: "text" };
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.grid2x3}>
                <FormField
                    label={labels.client}
                    value={quote.client}
                    onChange={(v) => update("client", v)}
                    ref={clientRef}
                    onEnter={() => licensePlateRef.current?.focus()}
                    {...getFieldProps(labels.client)}
                />
                <FormField
                    label={labels.licensePlate}
                    value={quote.licensePlate}
                    onChange={(v) => update("licensePlate", v)}
                    ref={licensePlateRef}
                    onEnter={() => modelRef.current?.focus()}
                    {...getFieldProps(labels.licensePlate)}
                />
                <FormField
                    label={labels.model}
                    value={quote.model}
                    onChange={(v) => update("model", v)}
                    ref={modelRef}
                    onEnter={() => yearRef.current?.focus()}
                    {...getFieldProps(labels.model)}
                />
                <FormField
                    label={labels.year}
                    value={quote.year}
                    onChange={(v) => update("year", v)}
                    ref={yearRef}
                    onEnter={() => chassisRef.current?.focus()}
                    {...getFieldProps(labels.year)}
                />
                <FormField
                    label={labels.chassis}
                    value={quote.chassis}
                    onChange={(v) => update("chassis", v)}
                    ref={chassisRef}
                    onEnter={() => insuranceRef.current?.focus()}
                    {...getFieldProps(labels.chassis)}
                />
                <FormField
                    label={labels.insurance}
                    value={quote.insurance}
                    onChange={(v) => update("insurance", v)}
                    ref={insuranceRef}
                    onEnter={() => quoteDateRef.current?.focus()}
                    {...getFieldProps(labels.insurance)}
                />
            </div>

            <div className={styles.grid1col}>
                <FormField
                    label={labels.quoteDate}
                    value={quote.quoteDate || today}
                    onChange={(v) => update("quoteDate", v)}
                    ref={quoteDateRef}
                    {...getFieldProps(labels.quoteDate)}
                />
            </div>
        </div>
    );
}
