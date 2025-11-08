import ComplementaryItemsTable from "../components/ComplementaryItemsTable/ComplementaryItemsTable";
import QuoteGeneralFields from "../components/QuoteGeneralFields/QuoteGeneralFields";
import QuoteItemsTable from "../components/QuoteItemsTable/QuoteItemsTable";
import QuoteSave from "../components/QuoteSave/QuoteSave"; // <-- import the save component
import { useQuote } from "../contexts/QuoteContext";

export default function QuotePage() {
    const { quote, updateQuote, items, setItems, autoTotals, setAutoTotals } = useQuote();

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Quote Page</h1>

            {/* General Info */}
            <QuoteGeneralFields quote={quote} update={updateQuote} />

            {/* Main Table — sends SR/LA/VE/ME totals upward */}
            <QuoteItemsTable
                items={items}
                setItems={setItems}
                onTotalsChange={setAutoTotals}
            />

            {/* Complementary Items Table — uses context for autoTotals & storedComplementary */}
            <ComplementaryItemsTable />

            {/* Save Button */}
            <div className="mt-4">
                <QuoteSave mode="create" />
            </div>
        </div>
    );
}
