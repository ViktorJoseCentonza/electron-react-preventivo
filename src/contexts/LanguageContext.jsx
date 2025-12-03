import { createContext, useContext, useState } from "react";
import en from "../lang/en";
import it from "../lang/it";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState("it");

    const labels = lang === "it" ? it : en;

    const switchLanguage = (code) => setLang(code);

    return (
        <LanguageContext.Provider value={{ labels, lang, switchLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
