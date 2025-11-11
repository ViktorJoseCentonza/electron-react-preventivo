import { Link } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageToggle from "../LanguageToggle/LanguageToggle";
import SearchComponent from "../SearchComponent/SearchComponent";
import styles from "./Header.module.css";

export default function Header() {
    const { labels } = useLanguage();

    return (
        <header className={styles.header}>
            <div className={styles.titleWrapper}>
                <h1 className={styles.title}>{labels.appTitle}</h1>
            </div>

            <nav className={styles.nav}>
                <Link to="/" className="navLink">{labels.home}</Link>
                <Link to="/quote" className="navLink">{labels.newQuote}</Link>
            </nav>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <SearchComponent />
                </div>
                <LanguageToggle />
            </div>
        </header>
    );
}
