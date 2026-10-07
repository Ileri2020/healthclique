export type PrintableVitalReading = {
  recordedAt: string
  systolic: number
  diastolic: number
  pulse: number
  bloodSugar?: number | null
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}[character] ?? character))

const readableDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value.slice(0, 10) : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
}

function createMetricChart(title: string, unit: string, values: Array<{ date: string; value: number | null | undefined }>, color: string) {
  const points = values.filter((item) => item.value !== undefined && item.value !== null && Number.isFinite(item.value))
  if (!points.length) return `<section class="chart empty"><h2>${escapeHtml(title)}</h2><p>No readings recorded.</p></section>`

  const width = 880
  const height = 250
  const left = 58
  const right = 24
  const top = 24
  const bottom = 42
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const rawValues = points.map((point) => Number(point.value))
  const rawMin = Math.min(...rawValues)
  const rawMax = Math.max(...rawValues)
  const span = Math.max(rawMax - rawMin, rawMax * 0.12, 10)
  const min = Math.max(0, rawMin - span * 0.25)
  const max = rawMax + span * 0.25
  const x = (index: number) => left + (points.length === 1 ? chartWidth / 2 : index / (points.length - 1) * chartWidth)
  const y = (value: number) => top + ((max - value) / Math.max(max - min, 1)) * chartHeight
  const polyline = points.map((point, index) => `${x(index)},${y(Number(point.value))}`).join(" ")
  const grid = Array.from({ length: 5 }, (_, index) => {
    const value = min + ((max - min) * index) / 4
    const yPosition = y(value)
    return `<g><line x1="${left}" y1="${yPosition}" x2="${width - right}" y2="${yPosition}" stroke="#e2e8f0"/><text x="${left - 10}" y="${yPosition + 4}" text-anchor="end" fill="#64748b" font-size="11">${Math.round(value)}</text></g>`
  }).join("")
  const labelStep = Math.max(1, Math.ceil(points.length / 6))
  const labels = points.map((point, index) => index % labelStep === 0 || index === points.length - 1
    ? `<text x="${x(index)}" y="${height - 12}" text-anchor="middle" fill="#64748b" font-size="10">${escapeHtml(readableDate(point.date))}</text>`
    : "").join("")
  const dots = points.map((point, index) => `<circle cx="${x(index)}" cy="${y(Number(point.value))}" r="4" fill="${color}" stroke="white" stroke-width="2"><title>${escapeHtml(readableDate(point.date))}: ${Number(point.value)} ${escapeHtml(unit)}</title></circle>`).join("")

  return `<section class="chart"><div class="chart-heading"><h2>${escapeHtml(title)}</h2><span>${escapeHtml(unit)}</span></div><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)} trend">${grid}<polyline fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${polyline}"/>${dots}${labels}</svg></section>`
}

export function openVitalsPrintWindow(customerName: string, readings: PrintableVitalReading[]) {
  if (typeof window === "undefined" || !readings.length) return false
  const sorted = [...readings].sort((left, right) => new Date(left.recordedAt).getTime() - new Date(right.recordedAt).getTime())
  const reportTitle = `Vitals report - ${customerName}`
  const charts = [
    createMetricChart("Systolic pressure", "mmHg", sorted.map((reading) => ({ date: reading.recordedAt, value: reading.systolic })), "#e11d48"),
    createMetricChart("Diastolic pressure", "mmHg", sorted.map((reading) => ({ date: reading.recordedAt, value: reading.diastolic })), "#2563eb"),
    createMetricChart("Pulse", "bpm", sorted.map((reading) => ({ date: reading.recordedAt, value: reading.pulse })), "#059669"),
    createMetricChart("Blood sugar", "mg/dL", sorted.map((reading) => ({ date: reading.recordedAt, value: reading.bloodSugar })), "#d97706"),
  ].join("")
  const tableRows = [...sorted].reverse().map((reading) => `<tr><td>${escapeHtml(readableDate(reading.recordedAt))}</td><td>${reading.systolic}/${reading.diastolic} mmHg</td><td>${reading.pulse} bpm</td><td>${reading.bloodSugar == null ? "—" : `${reading.bloodSugar} mg/dL`}</td></tr>`).join("")
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(reportTitle)}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#eef2f7;color:#142238;font:13px/1.45 Arial,Helvetica,sans-serif}.report{max-width:960px;margin:24px auto;padding:32px;background:#fff;border:1px solid #dce3eb;box-shadow:0 12px 34px #15253a18}.brand{display:flex;align-items:center;gap:16px;padding-bottom:18px;border-bottom:2px solid #e2e8f0}.logo{width:64px;height:64px;object-fit:contain;border-radius:14px}.brand h1{margin:0;color:#075b9f;font-size:24px}.brand p{margin:3px 0;color:#64748b}.brand a{color:#075b9f;text-decoration:none}.report-title{margin:22px 0 4px;font-size:23px}.meta{color:#64748b}.free-check{margin:14px 0;padding:10px 12px;border:1px solid #bbf7d0;border-radius:9px;background:#f0fdf4;color:#166534;font-weight:700}.charts{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:22px 0}.chart{padding:14px;border:1px solid #e2e8f0;border-radius:12px;break-inside:avoid}.chart-heading{display:flex;justify-content:space-between;align-items:baseline}.chart h2{margin:0;font-size:14px}.chart-heading span,.chart.empty p{color:#64748b;font-size:11px}.chart svg{display:block;width:100%;height:auto;margin-top:8px}table{width:100%;border-collapse:collapse;margin-top:22px;font-size:12px}caption{text-align:left;padding:0 0 8px;font-weight:700;font-size:16px}th,td{padding:9px 10px;border-bottom:1px solid #e2e8f0;text-align:left}th{background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.05em}.footer{margin-top:22px;padding-top:12px;border-top:1px solid #e2e8f0;color:#64748b;font-size:10px;text-align:center}.footer strong{display:block;margin-bottom:3px;color:#075b9f;font-size:12px}.empty{min-height:140px}.empty p{padding-top:18px}@page{size:A4;margin:12mm}@media print{body{background:#fff}.report{max-width:none;margin:0;padding:0;border:0;box-shadow:none}.charts{gap:8px}.chart{padding:8px}.chart svg{max-height:175px}.brand,.chart,table{break-inside:avoid}.footer{position:static}}
  </style></head><body><main class="report"><header class="brand"><img class="logo" src="${window.location.origin}/greenlogo.png" alt="HealthClique"><div><h1>HealthClique</h1><p>Pharmacy · Customer vitals report</p><p>Ifelodun Bus Stop, Igbokuta Road</p><p>Tel: 08067239228 · 09159814350</p><p><a href="https://healthcliquecare.com/">www.healthcliquecare.com</a></p></div></header><h2 class="report-title">${escapeHtml(customerName)}</h2><p class="meta">${sorted.length} reading${sorted.length === 1 ? "" : "s"} · ${escapeHtml(readableDate(sorted[0].recordedAt))} to ${escapeHtml(readableDate(sorted[sorted.length - 1].recordedAt))}</p><p class="free-check">You are entitled to have your vitals checked here every day for free.</p><div class="charts">${charts}</div><table><caption>Reading history</caption><thead><tr><th>Date</th><th>Blood pressure</th><th>Pulse</th><th>Blood sugar</th></tr></thead><tbody>${tableRows}</tbody></table><footer class="footer"><strong>Thank you for choosing HealthClique!</strong>Confidential health information. For clinical interpretation, consult a qualified healthcare professional.</footer></main><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),350))</script></body></html>`

  try {
    let frame = document.getElementById("vitals-print-frame") as HTMLIFrameElement | null
    if (!frame) {
      frame = document.createElement("iframe")
      frame.id = "vitals-print-frame"
      frame.style.position = "fixed"
      frame.style.width = "0"
      frame.style.height = "0"
      frame.style.border = "0"
      frame.style.visibility = "hidden"
      document.body.appendChild(frame)
    }
    const frameDocument = frame.contentWindow?.document
    if (!frameDocument || !frame.contentWindow) return false
    frameDocument.open()
    frameDocument.write(html)
    frameDocument.close()
    frame.contentWindow.focus()
    return true
  } catch (error) {
    console.error("Unable to open vitals print view", error)
    return false
  }
}
