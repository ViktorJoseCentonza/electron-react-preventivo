import Decimal from "decimal.js";
import { forwardRef, useMemo } from "react";
import styles from "./FormField.module.css";

/**
 * FormField
 * - Handles comma decimals for numeric inputs.
 * - Supports an optional `symbol` rendered inside the input.
 */
const FormField = forwardRef(function FormField(
    {
        label,
        value,
        onChange,
        onEnter,
        type = "text",
        readOnly = false,
        symbol,             // e.g., "€"
        placeholder,
        maxLength,
        min,
        max,
        step,
        style,
        className,          // input class
        wrapperClassName,   // wrapper class (grid cell)
        skipTab = false,    // NEW: remove from tab order but keep clickable
        inputProps = {},    // extra input attrs
    },
    ref
) {
    const isNumber = type === "number";
    const actualType = isNumber ? "text" : type; // keep native "date" when passed

    // Render value as a string for the input
    const inputValue = useMemo(() => {
        if (value === null || value === undefined) return "";
        if (isNumber) {
            if (value === "") return "";
            return String(value); // Ensure value is a string for the input
        }
        return String(value);
    }, [value, isNumber]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter(e);
        }
    };

    // Normalization of input, converting commas to dots for decimal handling
    const normalizeNumber = (raw) => {
        if (raw === "" || raw === null || raw === undefined) return ""; // allow empty (ghost row)
        // Only replace commas with dots (no other transformations)
        const normalized = String(raw).replace(",", ".");
        const n = new Decimal(normalized); // Ensure we parse the string correctly
        return n.isNaN() ? "" : n.toString(); // Return a valid number or empty string
    };

    const handleChange = (e) => {
        let raw = e.target.value;

        if (isNumber) {
            // Allow the user to type freely with commas or dots without modifying them
            onChange?.(raw);  // Keep the raw value for the input field
        } else {
            if (typeof maxLength === "number" && raw.length > maxLength) {
                raw = raw.slice(0, maxLength);
            }
            onChange?.(raw);
        }
    };

    // On blur, normalize the value and update it
    const handleBlur = (e) => {
        let raw = e.target.value;
        if (isNumber) {
            const normalized = normalizeNumber(raw); // Normalize on blur (finalizing input)
            onChange?.(normalized);
        }
    };

    const inputEl = (
        <input
            ref={ref}
            type={actualType}
            inputMode={isNumber ? "decimal" : undefined}
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}  // Normalize on blur (focus lost)
            readOnly={readOnly}
            aria-readonly={readOnly ? "true" : undefined}
            placeholder={placeholder}
            maxLength={maxLength}
            min={isNumber ? min : undefined}
            max={isNumber ? max : undefined}
            step={isNumber ? step : undefined}
            tabIndex={skipTab ? -1 : inputProps.tabIndex ?? undefined}  // <- skip sequential tab if requested
            className={`${styles.input} ${className || ""}`}
            style={style}
            {...inputProps}
        />
    );

    return (
        <div className={`${styles.fieldWrapper} ${wrapperClassName || ""}`}>
            {label && <label className={styles.label}>{label}</label>}
            {symbol ? (
                <div className={styles.symbolWrapper}>
                    {inputEl}
                    <span className={styles.symbol}>{symbol}</span>
                </div>
            ) : (
                inputEl
            )}
        </div>
    );
});

export default FormField;
