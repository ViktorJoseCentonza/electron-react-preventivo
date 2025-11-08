// FormField.jsx
import { forwardRef } from "react";
import styles from "./FormField.module.css";

const FormField = forwardRef(
    ({ label, value, onChange, onEnter, type = "text", symbol }, ref) => {
        return (
            <div className={styles.fieldWrapper}>
                <label className={styles.label}>{label}</label>
                {symbol ? (
                    <div className={styles.symbolWrapper}>
                        <input
                            ref={ref}
                            type={type}
                            className={styles.input}
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && onEnter) onEnter();
                            }}
                        />
                        <span className={styles.symbol}>{symbol}</span>
                    </div>
                ) : (
                    <input
                        ref={ref}
                        type={type}
                        className={styles.input}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && onEnter) onEnter();
                        }}
                    />
                )}
            </div>
        );
    }
);

export default FormField;
