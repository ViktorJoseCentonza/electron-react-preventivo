import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./LanguageToggle.module.css";

export default function LanguageToggle() {
    const { lang, switchLanguage } = useLanguage();

    const toggleLang = () => {
        switchLanguage(lang === "it" ? "en" : "it");
    };

    return (
        <div
            className={`${styles.toggleWrapper} ${lang === "en" ? styles.en : ""}`}
            onClick={toggleLang}
        >
            <div className={styles.thumbContainer}>
                <div className={styles.sliderThumb}></div>
            </div>
        </div>
    );
}
