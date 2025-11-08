import { useLanguage } from "../../contexts/LanguageContext";
import styles from "./Footer.module.css";

export default function Footer() {
    const { labels } = useLanguage();
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            {labels.footer.replace("{{year}}", year)}
        </footer>
    );
}
