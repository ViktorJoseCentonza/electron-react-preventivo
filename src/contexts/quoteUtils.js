import Decimal from "decimal.js";

/**
 * Defensive numeric coercion: accepts numbers, numeric strings (with commas),
 * null/undefined/empty → 0.
 */
const num = (v) => {
    if (v === "" || v == null) return 0;
    if (typeof v === "number") return Number.isNaN(v) ? 0 : v;

    // Convert comma to dot for decimals
    const normalized = String(v).replace(",", ".").trim();
    const n = new Decimal(normalized);  // Use Decimal for more precision and control
    return n.isNaN() ? 0 : n.toNumber();
};

export const recalculateQuote = (quote) => {
    // Ensure structure exists
    quote.items = Array.isArray(quote.items) ? quote.items : [];
    const comp = quote.complementary || (quote.complementary = {});

    comp.parts = comp.parts || { quantity: 0, price: 0, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 };
    comp.bodywork = comp.bodywork || { quantity: 0, price: 40, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 };
    comp.mechanics = comp.mechanics || { quantity: 0, price: 40, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 };
    comp.consumables = comp.consumables || { quantity: 0, price: 24, tax: 22, total: 0, taxable: 0, taxAmount: 0, totalWithTax: 0 };
    comp.partsTotal = comp.partsTotal || { total: 0, taxable: 0, tax: 22, taxAmount: 0, totalWithTax: 0 };

    // 1) Per-item totals = quantity * price
    quote.items.forEach((item) => {
        const qty = new Decimal(num(item.quantity));
        const price = new Decimal(num(item.price));
        item.total = qty.mul(price).toNumber();
    });

    // 2) Totale ricambi (sum of item subtotals)
    const partsSum = quote.items.reduce((acc, it) => acc.plus(num(it.total)), new Decimal(0));
    const partsTaxPct = new Decimal(num(comp.partsTotal.tax || 22));
    const partsTaxAmount = partsSum.mul(partsTaxPct).div(100);

    comp.partsTotal.total = partsSum.toNumber();
    comp.partsTotal.taxable = partsSum.toNumber();
    comp.partsTotal.taxAmount = partsTaxAmount.toNumber();
    comp.partsTotal.totalWithTax = partsSum.plus(partsTaxAmount).toNumber();

    // 3) Auto-qty for complementary rows
    let bodyQty = new Decimal(0);
    let mechQty = new Decimal(0);
    let consQty = new Decimal(0);

    quote.items.forEach((it) => {
        const sr = new Decimal(num(it.SR));
        const la = new Decimal(num(it.LA));
        const ve = new Decimal(num(it.VE));
        const me = new Decimal(num(it.ME));

        bodyQty = bodyQty.plus(sr.plus(la).plus(ve)); // SR + LA + VE
        mechQty = mechQty.plus(me);                   // ME
        consQty = consQty.plus(ve);                   // VE
    });

    comp.bodywork.quantity = bodyQty.toNumber();
    comp.mechanics.quantity = mechQty.toNumber();
    comp.consumables.quantity = consQty.toNumber();

    // 4) Compute complementary rows
    const computeRow = (row) => {
        const qty = new Decimal(num(row.quantity));
        const price = new Decimal(num(row.price));
        const taxPct = new Decimal(num(row.tax || 22));

        const total = qty.mul(price);
        const taxAmount = total.mul(taxPct).div(100);
        const totalWithTax = total.plus(taxAmount);

        row.total = total.toNumber();
        row.taxable = total.toNumber();
        row.taxAmount = taxAmount.toNumber();
        row.totalWithTax = totalWithTax.toNumber();
    };

    computeRow(comp.parts);
    computeRow(comp.bodywork);
    computeRow(comp.mechanics);
    computeRow(comp.consumables);

    // 5) Totale preventivo
    const subtotal = new Decimal(num(comp.partsTotal.total))
        .plus(num(comp.parts.total))
        .plus(num(comp.bodywork.total))
        .plus(num(comp.mechanics.total))
        .plus(num(comp.consumables.total));

    const iva = new Decimal(num(comp.partsTotal.taxAmount))
        .plus(num(comp.parts.taxAmount))
        .plus(num(comp.bodywork.taxAmount))
        .plus(num(comp.mechanics.taxAmount))
        .plus(num(comp.consumables.taxAmount));

    quote.totals = quote.totals || { subtotal: 0, iva: 0, totalWithIva: 0 };
    quote.totals.subtotal = subtotal.toNumber();
    quote.totals.iva = iva.toNumber();
    quote.totals.totalWithIva = subtotal.plus(iva).toNumber();
};
