export type SalesReceiptLine = {
  productName: string
  quantity: string
  unitPrice: number
  total: number
}

export type SalesReceipt = {
  receiptNumber: string
  customerName: string
  date: string
  paymentMethod: string
  cashPaid: number
  posPayment: number
  change: number
  total: number
  rows: SalesReceiptLine[]
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character] ?? character))

export const formatReceiptMoney = (value: number) => `₦${Number(value || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const createReceiptPrintDocument = (receipts: SalesReceipt[], logoUrl: string) => {
  const documentTitle = receipts.length === 1
    ? `HealthClique receipt - ${receipts[0].customerName || "Walk-in customer"}`
    : `HealthClique receipts - ${receipts.length} sales`

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(documentTitle)}</title>
<style>
  *{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#142238;font:13px/1.45 Arial,Helvetica,sans-serif}
  .receipt{width:80mm;max-width:100%;margin:20px auto;padding:7mm 5mm;background:#fff;border:1px solid #dce3eb;box-shadow:0 12px 34px #15253a18;page-break-after:always;break-after:page}
  .receipt:last-child{page-break-after:auto;break-after:auto}.brand{text-align:center;padding-bottom:12px;border-bottom:1px dashed #aab5c3}.brand-logo{display:block;width:52mm;max-width:100%;height:auto;margin:0 auto 6px}.brand p{margin:3px 0;color:#65758b;font-size:9px;line-height:1.45}.brand .tagline{font-size:9px;letter-spacing:1.2px;text-transform:uppercase}.brand a{color:#075b9f;text-decoration:none}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:13px 0;font-size:11px}.meta div:last-child{text-align:right}.muted{color:#6a788b}.meta strong{display:block;color:#17263a;font-size:11px}
  .customer{margin:10px 0 13px;padding:8px 9px;border-radius:7px;background:#f3f8fc;font-size:11px}.customer strong{display:block;margin-top:2px;font-size:13px}
  table{width:100%;border-collapse:collapse;font-size:10px}th{padding:6px 3px;border-bottom:1px solid #dce3eb;color:#6a788b;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.4px}td{padding:7px 3px;border-bottom:1px solid #edf0f4;vertical-align:top}th:last-child,td:last-child{text-align:right;white-space:nowrap}.product{font-weight:700;color:#17263a}.qty{display:block;margin-top:2px;color:#718096;font-size:9px}.totals{margin:12px 0 0 auto;width:75%;font-size:11px}.totals div{display:flex;justify-content:space-between;gap:8px;padding:3px 0}.totals .grand{margin-top:4px;padding-top:8px;border-top:1px solid #dce3eb;color:#075b9f;font-size:15px;font-weight:800}.thanks{margin-top:17px;padding-top:12px;border-top:1px dashed #aab5c3;text-align:center;color:#64748b;font-size:10px}.thanks strong{display:block;margin-bottom:3px;color:#075b9f;font-size:12px}
  @page{size:80mm 297mm;margin:2mm}@media print{html,body{background:#fff;width:80mm;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.receipt{width:76mm;max-width:100%;margin:0 auto;padding:2mm 1mm;border:0;box-shadow:none}.receipt:last-child{page-break-after:auto}}
</style></head><body>${receipts.map((receipt) => {
  const received = Math.max(0, receipt.cashPaid + receipt.posPayment - receipt.change)
  const balance = Math.max(0, receipt.total - received)
  return `<article class="receipt">
    <header class="brand"><img class="brand-logo" src="${escapeHtml(logoUrl)}" alt="HealthClique"><p class="tagline">Pharmacy · Sales receipt</p><p>Ifelodun Bus Stop, Igbokuta Road</p><p>Tel: 08067239228 · 09159814350</p><p><a href="https://healthcliquecare.com/">www.healthcliquecare.com</a></p></header>
    <section class="meta"><div><span class="muted">Receipt</span><strong>${escapeHtml(receipt.receiptNumber)}</strong></div><div><span class="muted">Date</span><strong>${escapeHtml(receipt.date)}</strong></div></section>
    <div class="customer"><span class="muted">Customer</span><strong>${escapeHtml(receipt.customerName || "Walk-in customer")}</strong></div>
    <table><thead><tr><th>Item</th><th>Price</th><th>Amount</th></tr></thead><tbody>${receipt.rows.map((row) => `<tr><td><span class="product">${escapeHtml(row.productName)}</span><span class="qty">${escapeHtml(row.quantity)}</span></td><td>${formatReceiptMoney(row.unitPrice)}</td><td>${formatReceiptMoney(row.total)}</td></tr>`).join("")}</tbody></table>
    <section class="totals"><div><span>Payment</span><span>${escapeHtml(receipt.paymentMethod || "Not specified")}</span></div><div><span>Cash</span><span>${formatReceiptMoney(receipt.cashPaid)}</span></div><div><span>POS / transfer</span><span>${formatReceiptMoney(receipt.posPayment)}</span></div><div><span>Change</span><span>${formatReceiptMoney(receipt.change)}</span></div><div><span>Balance due</span><span>${formatReceiptMoney(balance)}</span></div><div class="grand"><span>Total</span><span>${formatReceiptMoney(receipt.total)}</span></div></section>
    <footer class="thanks"><strong>Thank you for patronizing us!</strong>We appreciate your trust in HealthClique. Please keep this receipt for your records.</footer>
  </article>`
}).join("")}</body></html>`
}

export const openSalesReceiptPrintWindow = (receipts: SalesReceipt[]) => {
  if (typeof window === "undefined" || receipts.length === 0) return false

  const htmlContent = createReceiptPrintDocument(receipts, `${window.location.origin}/greenlogo.png`)

  try {
    let iframe = document.getElementById("sales-receipt-print-frame") as HTMLIFrameElement | null
    if (!iframe) {
      iframe = document.createElement("iframe")
      iframe.id = "sales-receipt-print-frame"
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      iframe.style.visibility = "hidden"
      document.body.appendChild(iframe)
    }

    const frameDoc = iframe.contentWindow?.document || iframe.contentDocument
    if (frameDoc && iframe.contentWindow) {
      frameDoc.open()
      frameDoc.write(htmlContent)
      frameDoc.close()

      iframe.contentWindow.focus()
      window.setTimeout(() => {
        try {
          iframe?.contentWindow?.print()
        } catch (printErr) {
          console.error("Iframe print error, attempting window fallback", printErr)
          fallbackWindowOpen(htmlContent)
        }
      }, 300)
      return true
    }
  } catch (error) {
    console.error("Iframe creation failed, attempting window fallback", error)
  }

  return fallbackWindowOpen(htmlContent)
}

const fallbackWindowOpen = (htmlContent: string) => {
  const printWindow = window.open("", "_blank", "width=440,height=760")
  if (!printWindow) return false

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => printWindow.print(), 300)
  return true
}
