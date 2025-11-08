import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageToggle from "../LanguageToggle/LanguageToggle";
import styles from "./Header.module.css";

export default function Header() {
    const { labels } = useLanguage();

    return (
        <header className={styles.header}>
            <h1 className={styles.title}>{labels.appTitle}</h1>

            <nav>
                <Link to="/" className="navLink">{labels.home}</Link>
                <Link to="/quote" className="navLink">{labels.newQuote}</Link>
            </nav>

            <LanguageToggle />
        </header>
    );
}
