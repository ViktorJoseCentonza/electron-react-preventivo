import { useState } from "react";
import ComplementaryItemsTable from "../components/ComplementaryItemsTable/ComplementaryItemsTable";
import QuoteGeneralFields from "../components/QuoteGeneralFields/QuoteGeneralFields";
import QuoteItemsTable from "../components/QuoteItemsTable/QuoteItemsTable";

export default function QuotePage() {
    const [quote, setQuote] = useState({
        client: "",
        licensePlate: "",
        model: "",
        year: "",
        chassis: "",
        insurance: "",
        quoteDate: ""
    });

    const [items, setItems] = useState([]);

    const [storedComplementary, setStoredComplementary] = useState({
        voci: { quantity: "", price: "", iva: "22" },
        carrozzeria: { quantity: "", price: "40", iva: "22" },
        meccanica: { quantity: "", price: "40", iva: "22" },
        consumo: { quantity: "", price: "24", iva: "22" },
        final: { quantity: "", price: "", iva: "22" }
    });


    const update = (field, value) => {
        setQuote({ ...quote, [field]: value });
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Quote Page</h1>

            {/* GENERAL FIELDS */}
            <QuoteGeneralFields quote={quote} update={update} />

            {/* MAIN ITEMS TABLE */}
            <QuoteItemsTable items={items} setItems={setItems} />

            {/* COMPLEMENTARY ITEMS TABLE */}
            <ComplementaryItemsTable
                values={storedComplementary}
                onChange={(updated) => setStoredComplementary(updated)}
            />
        </div>
    );
}
