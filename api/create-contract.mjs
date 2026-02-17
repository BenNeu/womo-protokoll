export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const data = req.body

    const fmt = (val) => val || '-'
    const fmtPrice = (val) => val ? parseFloat(val).toFixed(2).replace('.', ',') : '0,00'
    const fmtDate = (dateStr) => {
      if (!dateStr) return '-'
      const d = new Date(dateStr)
      return d.toLocaleDateString('de-DE')
    }

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; padding: 20mm 20mm 20mm 20mm; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 6mm; color: #1a1a1a; }
  h2 { font-size: 12pt; font-weight: bold; margin-top: 6mm; margin-bottom: 3mm; }
  h3 { font-size: 11pt; font-weight: bold; margin-top: 4mm; margin-bottom: 2mm; }
  p { margin-bottom: 2mm; }
  .subtitle { text-align: center; font-size: 10pt; color: #555; margin-bottom: 8mm; }
  .parties { display: flex; gap: 10mm; margin: 6mm 0; }
  .party-box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 4mm; background: #f9f9f9; }
  .party-box strong { display: block; margin-bottom: 2mm; font-size: 11pt; }
  .party-label { font-size: 9pt; color: #666; font-style: italic; margin-top: 2mm; }
  .section { margin-top: 5mm; }
  .section p { margin-bottom: 1.5mm; }
  .clause { margin-bottom: 3mm; }
  .clause-num { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin: 3mm 0; }
  th { background: #f0f0f0; padding: 2mm 3mm; text-align: left; font-size: 10pt; border: 1px solid #ddd; }
  td { padding: 2mm 3mm; border: 1px solid #ddd; font-size: 10pt; }
  .highlight { background: #f5f5f5; padding: 3mm; border-left: 3px solid #333; margin: 3mm 0; }
  .signatures { display: flex; gap: 10mm; margin-top: 10mm; }
  .sig-box { flex: 1; border-top: 2px solid #333; padding-top: 3mm; }
  .sig-box p { font-size: 9pt; color: #555; }
  .sig-image { max-width: 60mm; max-height: 20mm; margin-bottom: 2mm; }
  ul { padding-left: 8mm; margin: 2mm 0; }
  ul li { margin-bottom: 1mm; }
  .page-break { page-break-before: always; }
  .logo-header { text-align: center; margin-bottom: 6mm; }
  .logo-header img { max-height: 15mm; }
  .info-row { display: flex; gap: 5mm; }
  .info-row .info-col { flex: 1; }
</style>
</head>
<body>

<h1>Mietvertrag für ein Wohnmobil</h1>
<div class="subtitle">
  Vertragsnummer: <strong>${fmt(data.contract_number)}</strong> &nbsp;|&nbsp; 
  Datum: <strong>${fmtDate(data.signature_date || new Date())}</strong>
</div>

<p style="text-align:center; margin-bottom:4mm;">zwischen</p>

<div class="parties">
  <div class="party-box">
    <strong>Vermieter:</strong>
    Orcacampers<br>
    Andreas Grimm &amp; Ben Neuendorf GbR<br>
    Benzstrasse 3, 97209 Veitshöchheim<br>
    +49 178 641 3873<br>
    info@orcacampers.de
    <div class="party-label">– nachfolgend „Vermieter" genannt –</div>
  </div>
  <div class="party-box">
    <strong>Mieter:</strong>
    ${fmt(data.customer_name)}<br>
    ${fmt(data.customer_address)}<br>
    ${fmt(data.customer_phone)}<br>
    ${fmt(data.customer_email)}<br>
    Ausweis-Nr.: ${fmt(data.customer_id_number)}<br>
    Führerschein-Nr.: ${fmt(data.customer_drivers_license)}
    <div class="party-label">– nachfolgend „Mieter" genannt –</div>
  </div>
</div>

<div class="section">
<h2>§ 1 Mietgegenstand</h2>
<p><span class="clause-num">1.</span> Der Vermieter vermietet an den Mieter das nachfolgend beschriebene Wohnmobil (nachfolgend „Fahrzeug" genannt):</p>
<table>
  <tr><td style="width:45%"><strong>Fahrzeug-Hersteller</strong></td><td>${fmt(data.vehicle_manufacturer)}</td></tr>
  <tr><td><strong>Fahrzeug-Modell</strong></td><td>${fmt(data.vehicle_model)}</td></tr>
  <tr><td><strong>Amtliches Kennzeichen</strong></td><td>${fmt(data.vehicle_license_plate || data.vehicle_registration)}</td></tr>
  <tr><td><strong>Fahrzeug-Ident.-Nr. (VIN)</strong></td><td>${fmt(data.vehicle_vin)}</td></tr>
  <tr><td><strong>Kilometerstand bei Übergabe</strong></td><td>${fmt(data.rental_start_mileage)} km</td></tr>
</table>

<p><span class="clause-num">2.</span> Das Fahrzeug ist wie folgt ausgestattet:</p>
<p style="padding-left:5mm;">${fmt(data.vehicle_equipment) !== '-' ? fmt(data.vehicle_equipment) : 'Markise, Küchenausstattung, Campingmöbel, Bettwäsche, Handtücher (Ausstattung gemäß Fahrzeugbeschreibung)'}</p>

<p><span class="clause-num">3.</span> Das Fahrzeug wird mit folgenden Dokumenten übergeben:</p>
<ul>
  <li>Zulassungsbescheinigung Teil I (Fahrzeugschein)</li>
  <li>Versicherungsnachweis</li>
  <li>Bedienungsanleitungen</li>
</ul>

<p><span class="clause-num">4.</span> Bestehende Vorschäden am Fahrzeug werden in einem separaten Übergabeprotokoll dokumentiert, das Bestandteil dieses Vertrages ist.</p>
</div>

<div class="section">
<h2>§ 2 Mietzeit und Mietpreis</h2>
<p><span class="clause-num">5.</span> Die Mietzeit beginnt am <strong>${fmtDate(data.rental_start_date)}</strong> um <strong>${fmt(data.rental_start_time || '14:00')}</strong> Uhr und endet am <strong>${fmtDate(data.rental_end_date)}</strong> um <strong>${fmt(data.rental_end_time || '10:00')}</strong> Uhr.</p>

<p><span class="clause-num">6.</span> Der Gesamtmietpreis beträgt <strong>${fmtPrice(data.total_amount)} €</strong> und setzt sich wie folgt zusammen:</p>
<table>
  <tr><td>Mietpreis pro Nacht</td><td>${fmtPrice(data.daily_rate)} €</td></tr>
  <tr><td>Anzahl Nächte</td><td>${fmt(data.rental_days)}</td></tr>
  <tr><td>Mietpreis gesamt</td><td>${fmtPrice((data.daily_rate || 0) * (data.rental_days || 0))} €</td></tr>
  ${data.service_fee ? `<tr><td>Servicepauschale</td><td>${fmtPrice(data.service_fee)} €</td></tr>` : ''}
  ${data.extras_price && parseFloat(data.extras_price) > 0 ? "<tr><td>Extras (" + (data.extras_summary || "Einzelheiten siehe Rechnung") + ")</td><td>" + fmtPrice(data.extras_price) + " EUR</td></tr>" : ""}<tr style="font-weight:bold"><td>Gesamtbetrag</td><td>${fmtPrice(data.total_amount)} EUR</td></tr>
</table>

<p><span class="clause-num">7.</span> Die Zahlung des Gesamtmietpreises erfolgt wie folgt:</p>
<ul>
  <li>Anzahlung in Höhe von <strong>${fmtPrice(data.down_payment)} €</strong> bis zum <strong>${fmtDate(data.down_payment_due_date)}</strong> auf das unten genannte Konto.</li>
  <li>Restzahlung in Höhe von <strong>${fmtPrice(data.final_payment)} €</strong> bis zum <strong>${fmtDate(data.final_payment_due_date)}</strong> auf das unten genannte Konto oder in bar bei Übergabe.</li>
</ul>

<p><span class="clause-num">8.</span> Bankverbindung des Vermieters:</p>
<table>
  <tr><td style="width:40%">Kontoinhaber</td><td>Andreas Grimm und Ben Neuendorf GbR</td></tr>
  <tr><td>IBAN</td><td>${fmt(data.bank_iban)}</td></tr>
  <tr><td>BIC</td><td>${fmt(data.bank_bic)}</td></tr>
  <tr><td>Kreditinstitut</td><td>${fmt(data.bank_name)}</td></tr>
</table>
</div>

<div class="section">
<h2>§ 3 Kaution</h2>
<p><span class="clause-num">9.</span> Der Mieter hinterlegt bei Übergabe des Fahrzeugs eine Kaution in Höhe von <strong>${fmtPrice(data.deposit_amount)} €</strong> in bar oder per Vorab-Überweisung.</p>
<p><span class="clause-num">10.</span> Die Kaution dient zur Absicherung aller Ansprüche des Vermieters aus diesem Mietverhältnis, insbesondere für Schäden am Fahrzeug, die nicht von der Versicherung gedeckt sind, sowie für die Selbstbeteiligung im Schadensfall.</p>
<p><span class="clause-num">11.</span> Die Kaution wird nach ordnungsgemäßer Rückgabe des Fahrzeugs und nach Abzug eventueller Forderungen des Vermieters innerhalb von 14 Tagen an den Mieter zurückgezahlt.</p>
</div>

<div class="section">
<h2>§ 4 Versicherung</h2>
<p><span class="clause-num">12.</span> Für das Fahrzeug besteht eine Kfz-Haftpflichtversicherung sowie eine Voll- und Teilkaskoversicherung als Selbstfahrvermietfahrzeug.</p>
<p><span class="clause-num">13.</span> Die Selbstbeteiligung im Schadensfall beträgt:</p>
<ul>
  <li>Vollkaskoversicherung: <strong>${fmtPrice(data.deductible_full_coverage)} €</strong></li>
  <li>Teilkaskoversicherung: <strong>${fmtPrice(data.deductible_partial_coverage)} €</strong></li>
</ul>
<p><span class="clause-num">14.</span> Der Mieter haftet für Schäden bis zur Höhe der Selbstbeteiligung, sofern er den Schaden zu vertreten hat. Für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit des Mieters entstehen, haftet der Mieter in voller Höhe.</p>
</div>

<div class="section page-break">
<h2>§ 5 Nutzung des Fahrzeugs</h2>
<p><span class="clause-num">15.</span> Das Fahrzeug darf nur vom Mieter und den im Mietvertrag angegebenen weiteren Fahrern geführt werden.</p>
<p><span class="clause-num">16.</span> Das Mindestalter für alle Fahrer beträgt 25 Jahre. Alle Fahrer müssen seit mindestens 3 Jahren im Besitz einer gültigen Fahrerlaubnis der Klasse B sein.</p>
<p><span class="clause-num">17.</span> Fahrten sind in folgende Länder gestattet: ${fmt(data.permitted_countries)}. Außerhalb dieser Grenzen besteht kein Versicherungsschutz ohne schriftliche Zustimmung des Vermieters.</p>
<p><span class="clause-num">18.</span> Dem Mieter ist es untersagt, das Fahrzeug zu verwenden:</p>
<ul>
  <li>zur Teilnahme an motorsportlichen Veranstaltungen und Fahrzeugtests,</li>
  <li>zur Beförderung von explosiven, leicht entzündlichen, giftigen, radioaktiven oder sonst gefährlichen Stoffen,</li>
  <li>zur Begehung von Straftaten,</li>
  <li>zur Weitervermietung oder Verleihung.</li>
</ul>
</div>

<div class="section">
<h2>§ 6 Pflichten des Mieters und Vermieters</h2>
<p><span class="clause-num">19.</span> Der Vermieter übergibt das Fahrzeug in einem verkehrssicheren, technisch einwandfreien und gereinigten Zustand.</p>
<p><span class="clause-num">20.</span> Der Mieter ist verpflichtet, das Fahrzeug sorgfältig zu behandeln und nur für den vorgesehenen Zweck zu nutzen sowie die geltenden gesetzlichen Bestimmungen zu beachten.</p>
</div>

<div class="section">
<h2>§ 7 Verhalten bei Unfall oder Schaden</h2>
<p><span class="clause-num">22.</span> Der Mieter hat nach einem Unfall, Diebstahl, Brand, Wildschaden oder sonstigem Schaden sofort die Polizei zu verständigen und den Schaden dem Vermieter unverzüglich zu melden.</p>
<p><span class="clause-num">23.</span> Der Mieter hat alle Maßnahmen zu ergreifen, die der Aufklärung des Schadens dienen, insbesondere Daten der Beteiligten aufzunehmen sowie Fotos und eine Unfallskizze zu fertigen.</p>
</div>

<div class="section">
<h2>§ 8 Haftung</h2>
<p><span class="clause-num">24.</span> Der Vermieter haftet nicht für Gegenstände, die der Mieter im Fahrzeug zurücklässt.</p>
<p><span class="clause-num">25.</span> Der Mieter haftet für alle von ihm zu vertretenden Schäden am Fahrzeug. Die Haftung ist auf die Höhe der Selbstbeteiligung begrenzt, es sei denn, der Schaden wurde vorsätzlich oder grob fahrlässig verursacht.</p>
<p><span class="clause-num">26.</span> Der Mieter haftet unbeschränkt für alle Verstöße gegen gesetzliche Bestimmungen während der Mietzeit.</p>
</div>

<div class="section">
<h2>§ 9 Stornierung</h2>
<p>Bei Rücktritt des Mieters vom Vertrag vor dem vereinbarten Mietbeginn sind folgende Stornogebühren zu zahlen:</p>
<table>
  <tr><th>Zeitraum vor Mietbeginn</th><th>Stornogebühr</th></tr>
  <tr><td>bis zu 30 Tage</td><td>30 % des Mietpreises</td></tr>
  <tr><td>29. bis 8. Tag</td><td>35 % des Mietpreises</td></tr>
  <tr><td>ab dem 7. Tag</td><td>40 % des Mietpreises</td></tr>
  <tr><td>Am Tag der Anmietung oder Nichtabnahme</td><td>95 % des Mietpreises</td></tr>
</table>
</div>

<div class="section">
<h2>§ 10 Übergabe und Rückgabe</h2>
<p><span class="clause-num">27.</span> Bei Übergabe und Rückgabe des Fahrzeugs wird gemeinsam ein Protokoll erstellt und unterzeichnet, in dem der Zustand, der Kilometerstand, der Tankfüllstand und eventuelle Mängel festgehalten werden.</p>
<p><span class="clause-num">28.</span> Bei verspäteter Rückgabe ist der Vermieter berechtigt, für jede angefangene Stunde <strong>${fmtPrice(data.fee_late_return_per_hour || 29)} €</strong> zu berechnen.</p>
</div>

<div class="section page-break">
<h2>§ 11 Rückgabezustand, verspätete Rückgabe und sonstige Gebühren</h2>

<p><span class="clause-num">29.</span> <strong>Rückgabezustand und Reinigung:</strong><br>
Der Mieter ist verpflichtet, das Fahrzeug in besenreinem Zustand zurückzugeben. Die WC-Kassette sowie der Abwassertank müssen vor der Rückgabe fachgerecht entleert werden.</p>
<ul>
  <li>Professionelle Innenreinigung (bei Bedarf): <strong>${fmtPrice(data.fee_professional_cleaning || 139)} €</strong></li>
  <li>Toiletten- und Abwasserentsorgung: <strong>${fmtPrice(data.fee_toilet_disposal || 200)} €</strong></li>
</ul>

<p><span class="clause-num">30.</span> <strong>Verspätete Rückgabe:</strong> <strong>${fmtPrice(data.fee_late_return_per_hour || 29)} €</strong> je angefangener Stunde.</p>

<p><span class="clause-num">31.</span> <strong>Buchungsänderungen:</strong> Jede Änderung einer bestätigten Buchung kostet eine Bearbeitungsgebühr von <strong>${fmtPrice(data.fee_booking_change || 21)} €</strong>.</p>

<p><span class="clause-num">32.</span> <strong>Rauchverbot:</strong> In allen Fahrzeugen des Vermieters herrscht ein absolutes Rauchverbot. Bei Verstoß wird eine Reinigungsgebühr von <strong>${fmtPrice(data.fee_smoking_violation || 1000)} €</strong> fällig.</p>

<p><span class="clause-num">33.</span> <strong>Kilometerregelung:</strong> Im Mietpreis sind <strong>${fmt(data.included_km || 250)} km pro Miettag</strong> enthalten. Mehrkilometer werden mit <strong>${data.extra_km_rate ? parseFloat(data.extra_km_rate).toFixed(2).replace('.', ',') : '0,35'} € pro km</strong> berechnet. Unbegrenzte Kilometer optional für <strong>${fmtPrice(data.unlimited_km_fee || 240)} €</strong> pro Mietvertrag.</p>

<p><span class="clause-num">34.</span> <strong>Kraftstoff und Tankregelung:</strong> Das Fahrzeug wird vollgetankt übergeben und muss vollgetankt zurückgegeben werden. Bei nicht vollgetankter Rückgabe werden die Tankkosten zuzüglich einer Pauschalgebühr von <strong>${fmtPrice(data.fee_refueling || 35)} €</strong> berechnet.</p>
</div>

<div class="section">
<h2>§ 12 Schlussbestimmungen</h2>
<p><span class="clause-num">35.</span> Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform.</p>
<p><span class="clause-num">36.</span> Sollten einzelne Bestimmungen dieses Vertrages unwirksam sein, wird dadurch die Wirksamkeit der übrigen Bestimmungen nicht berührt.</p>
<p><span class="clause-num">37.</span> Ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Würzburg.</p>
</div>

<div style="margin-top:10mm;">
<p>Würzburg, den ${fmtDate(data.signature_date || new Date())}</p>
</div>

<div class="signatures">
  <div class="sig-box">
    ${data.signature_landlord 
      ? `<img src="${data.signature_landlord}" class="sig-image" alt="Unterschrift Vermieter" /><br>` 
      : '<div style="height:20mm;"></div>'}
    <p><strong>Unterschrift Vermieter</strong><br>Andreas Grimm / Ben Neuendorf<br>Orcacampers</p>
  </div>
  <div class="sig-box">
    ${data.signature_customer 
      ? `<img src="${data.signature_customer}" class="sig-image" alt="Unterschrift Mieter" /><br>` 
      : '<div style="height:20mm;"></div>'}
    <p><strong>Unterschrift Mieter</strong><br>${fmt(data.customer_name)}</p>
  </div>
</div>

</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(html)

  } catch (error) {
    console.error('Contract generation error:', error)
    return res.status(500).json({ error: error.message })
  }
}
