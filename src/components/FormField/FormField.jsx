import Decimal from "decimal.js";
import { forwardRef, useMemo } from "react";
import styles from "./FormField.module.css";

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

    const { onBlur: inputOnBlur, onChange: inputOnChange, tabIndex: inputTabIndex, ...restInputProps } = inputProps || {};

    const inputValue = useMemo(() => {
        if (value === null || value === undefined) return "";
        return String(value);
    }, [value]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter(e);
        }
    };

    const sanitizeLive = (raw) => {
        let s = String(raw).replace(/[^0-9.,]/g, "");

        const lastDot = s.lastIndexOf(".");
        const lastComma = s.lastIndexOf(",");
        const lastSep = Math.max(lastDot, lastComma);

        if (lastSep !== -1) {
            const before = s.slice(0, lastSep).replace(/[.,]/g, "");
            const after = s.slice(lastSep + 1).replace(/[.,]/g, "");

            let intPart = before.replace(/^0+(?=\d)/, "");
            if (intPart === "") intPart = "0";

            return `${intPart},${after.slice(0, 2)}`;
        }

        s = s.replace(/[.,]/g, "");
        s = s.replace(/^0+(?=\d)/, "");
        return s;
    };

    const formatOnBlur = (raw) => {
        let s = String(raw).replace(/[^0-9.,]/g, "");

        const lastDot = s.lastIndexOf(".");
        const lastComma = s.lastIndexOf(",");
        const lastSep = Math.max(lastDot, lastComma);

        if (lastSep !== -1) {
            const before = s.slice(0, lastSep).replace(/[.,]/g, "");
            const after = s.slice(lastSep + 1).replace(/[.,]/g, "");

            let intPart = before.replace(/^0+(?=\d)/, "");
            if (intPart === "") intPart = "0";

            let decPart = after.replace(/[.,]/g, "").slice(0, 2);

            if (decPart.length === 0) return intPart;

            if (decPart.length === 1) decPart = `${decPart}0`;

            if (decPart === "00") return intPart;

            return `${intPart},${decPart}`;
        }

        s = s.replace(/[.,]/g, "");
        s = s.replace(/^0+(?=\d)/, "");
        return s;
    };

    const normalizeForDecimal = (raw) => {
        if (raw === "" || raw === null || raw === undefined) return "";
        const normalized = String(raw).replace(/,/g, ".");
        const n = new Decimal(normalized);
        return n.isNaN() ? "" : n.toString();
    };

    const handleChange = (e) => {
        let raw = e.target.value;

        if (isNumber) {
            raw = sanitizeLive(raw);
            onChange?.(raw);
            inputOnChange?.(e);
            return;
        }

        if (typeof maxLength === "number" && raw.length > maxLength) {
            raw = raw.slice(0, maxLength);
        }
        onChange?.(raw);
        inputOnChange?.(e);
    };

    const handleBlur = (e) => {
        if (isNumber) {
            const formatted = formatOnBlur(e.target.value);
            onChange?.(formatted);
            normalizeForDecimal(formatted);
        }
        inputOnBlur?.(e);
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
            tabIndex={skipTab ? -1 : inputTabIndex ?? undefined}
            className={`${styles.input} ${className || ""}`}
            style={style}
            {...restInputProps}
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
