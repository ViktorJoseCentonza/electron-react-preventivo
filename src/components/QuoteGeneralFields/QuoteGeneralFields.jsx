import { useRef } from "react";
import { useQuote } from "../../contexts/QuoteContext";
import FormField from "../FormField/FormField";
import styles from "./QuoteGeneralFields.module.css";

export default function QuoteGeneralFields() {
    const { quote, updateQuoteField } = useQuote();

    const refs = {
        client: useRef(null),
        licensePlate: useRef(null),
        model: useRef(null),
        year: useRef(null),
        chassis: useRef(null),
        insurance: useRef(null),
        quoteDate: useRef(null)
    };

    const today = new Date().toISOString().split("T")[0];

    const getFieldProps = (key) => {
        switch (key) {
            case "client": return { type: "text", maxLength: 50 };
            case "licensePlate": return { type: "text", maxLength: 7, style: { textTransform: "uppercase" } };
            case "model": return { type: "text", maxLength: 50 };
            case "year": return { type: "number", min: 1900, max: 2100, inputMode: "numeric" };
            case "chassis": return { type: "text", maxLength: 17 };
            case "insurance": return { type: "text", maxLength: 50 };
            case "quoteDate": return { type: "date" };
            default: return { type: "text" };
        }
    };

    const labels = {
        client: "Client",
        licensePlate: "License Plate",
        model: "Model",
        year: "Year",
        chassis: "Chassis",
        insurance: "Insurance",
        quoteDate: "Quote Date"
    };

    if (!quote) return null; // defensive

    return (
        <div className={styles.container}>
            <div className={styles.grid2x3}>
                {["client", "licensePlate", "model", "year", "chassis", "insurance"].map((field, i, arr) => (
                    <FormField
                        key={field}
                        label={labels[field]}
                        value={quote[field] || ""}
                        onChange={(v) => updateQuoteField(field, v)}
                        ref={refs[field]}
                        onEnter={() => refs[arr[i + 1]]?.current?.focus()}
                        {...getFieldProps(field)}
                    />
                ))}
            </div>
            <div className={styles.grid1col}>
                <FormField
                    label={labels.quoteDate}
                    value={quote.quoteDate || today}
                    onChange={(v) => updateQuoteField("quoteDate", v)}
                    ref={refs.quoteDate}
                    {...getFieldProps("quoteDate")}
                />
            </div>
        </div>
    );
}
