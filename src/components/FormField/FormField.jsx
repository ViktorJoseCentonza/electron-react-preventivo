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
        symbol,
        placeholder,
        maxLength,
        min,
        max,
        step,
        style,
        className,
        wrapperClassName,
        skipTab = false,
        inputProps = {},
    },
    ref
) {
    const isNumber = type === "number";
    const actualType = isNumber ? "text" : type;


    const inputValue = useMemo(() => {
        if (value === null || value === undefined) return "";
        if (isNumber) {
            if (value === "") return "";
            return String(value);
        }
        return String(value);
    }, [value, isNumber]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter(e);
        }
    };


    const normalizeNumber = (raw) => {
        if (raw === "" || raw === null || raw === undefined) return "";

        const normalized = String(raw).replace(",", ".");
        const n = new Decimal(normalized);
        return n.isNaN() ? "" : n.toString();
    };

    const handleChange = (e) => {
        let raw = e.target.value;

        if (isNumber) {

            onChange?.(raw);
        } else {
            if (typeof maxLength === "number" && raw.length > maxLength) {
                raw = raw.slice(0, maxLength);
            }
            onChange?.(raw);
        }
    };


    const handleBlur = (e) => {
        let raw = e.target.value;
        if (isNumber) {
            const normalized = normalizeNumber(raw);
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
            onBlur={handleBlur}
            readOnly={readOnly}
            aria-readonly={readOnly ? "true" : undefined}
            placeholder={placeholder}
            maxLength={maxLength}
            min={isNumber ? min : undefined}
            max={isNumber ? max : undefined}
            step={isNumber ? step : undefined}
            tabIndex={skipTab ? -1 : inputProps.tabIndex ?? undefined}
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
