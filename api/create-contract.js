export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  try {
    const data = req.body
    const fmt = (val) => (val !== null && val !== undefined && val !== '') ? val : '-'
    const fmtPrice = (val) => val ? parseFloat(val).toFixed(2).replace('.', ',') : '0,00'
    const fmtDate = (dateStr) => {
      if (!dateStr) return '-'
      return new Date(dateStr).toLocaleDateString('de-DE')
    }

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; padding: 20mm; }
  h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 6mm; }
  h2 { font-size: 12pt; font-weight: bold; margin-top: 6mm; margin-bottom: 3mm; }
  p { margin-bottom: 2mm; }
  .parties { display: flex; gap: 10mm; margin: 6mm 0; }
  .party-box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 4mm; background: #f9f9f9; }
  .party-box strong { display: block; margin-bottom: 2mm; }
  table { width: 100%; border-collapse: collapse; margin: 3mm 0; }
  th { background: #f0f0f0; padding: 2mm 3mm; text-align: left; border: 1px solid #ddd; }
  td { padding: 2mm 3mm; border: 1px solid #ddd; }
  ul { padding-left: 8mm; margin: 2mm 0; }
  ul li { margin-bottom: 1mm; }
  .signatures { display: flex; gap: 10mm; margin-top: 10mm; }
  .sig-box { flex: 1; border-top: 2px solid #333; padding-top: 3mm; }
</style>
</head>
<body>

<h1>Mietvertrag für ein Wohnmobil</h1>
<p style="text-align:center;margin-bottom:4mm;">Vertragsnummer: <strong>${fmt(data.contract_number)}</strong> | Datum: <strong>${fmtDate(data.signature_date || new Date())}</strong></p>
<p style="text-align:center;margin-bottom:6mm;">zwischen</p>

<div class="parties">
  <div class="party-box">
    <strong>Vermieter:</strong>
    Orcacampers<br>
    Andreas Grimm &amp; Ben Neuendorf GbR<br>
    Benzstrasse 3, 97209 Veitshöchheim<br>
    +49 178 641 3873<br>
    info@orcacampers.de
    <br><em style="font-size:9pt;color:#666;">– nachfolgend „Vermieter" genannt –</em>
  </div>
  <div class="party-box">
    <strong>Mieter:</strong>
    ${fmt(data.customer_name)}<br>
    ${fmt(data.customer_address)}<br>
    ${fmt(data.customer_phone)}<br>
    ${fmt(data.customer_email)}<br>
    Ausweis-Nr.: ${fmt(data.customer_id_number)}<br>
    Führerschein-Nr.: ${fmt(data.customer_drivers_license)}
    <br><em style="font-size:9pt;color:#666;">– nachfolgend „Mieter" genannt –</em>
  </div>
</div>

<h2>§ 1 Mietgegenstand</h2>
<p>1. Der Vermieter vermietet an den Mieter das nachfolgend beschriebene Wohnmobil:</p>
<table>
  <tr><td style="width:45%"><strong>Fahrzeug-Hersteller</strong></td><td>${fmt(data.vehicle_manufacturer)}</td></tr>
  <tr><td><strong>Fahrzeug-Modell</strong></td><td>${fmt(data.vehicle_model)}</td></tr>
  <tr><td><strong>Amtliches Kennzeichen</strong></td><td>${fmt(data.vehicle_license_plate)}</td></tr>
  <tr><td><strong>Fahrzeug-Ident.-Nr. (VIN)</strong></td><td>${fmt(data.vehicle_vin)}</td></tr>
  <tr><td><strong>Kilometerstand bei Übergabe</strong></td><td>${fmt(data.rental_start_mileage)} km</td></tr>
</table>
<p>2. Ausstattung: ${fmt(data.vehicle_equipment)}</p>
<p>3. Das Fahrzeug wird mit Zulassungsbescheinigung, Versicherungsnachweis und Bedienungsanleitungen übergeben.</p>
<p>4. Bestehende Vorschäden werden in einem separaten Übergabeprotokoll dokumentiert.</p>

<h2>§ 2 Mietzeit und Mietpreis</h2>
<p>5. Die Mietzeit beginnt am <strong>${fmtDate(data.rental_start_date)}</strong> um <strong>${fmt(data.rental_start_time || '14:00')}</strong> Uhr und endet am <strong>${fmtDate(data.rental_end_date)}</strong> um <strong>${fmt(data.rental_end_time || '10:00')}</strong> Uhr.</p>
<p>6. Der Gesamtmietpreis beträgt <strong>${fmtPrice(data.total_amount)} EUR</strong>:</p>
<table>
  <tr><td>Mietpreis pro Nacht</td><td>${fmtPrice(data.daily_rate)} EUR</td></tr>
  <tr><td>Anzahl Nächte</td><td>${fmt(data.rental_days)}</td></tr>
  <tr><td>Mietpreis gesamt</td><td>${fmtPrice((parseFloat(data.daily_rate)||0)*(parseFloat(data.rental_days)||0))} EUR</td></tr>
  ${data.extras_price && parseFloat(data.extras_price) > 0 ? "<tr><td>Extras (" + (data.extras_summary || "Einzelheiten siehe Rechnung") + ")</td><td>" + fmtPrice(data.extras_price) + " EUR</td></tr>" : ""}
  <tr style="font-weight:bold"><td>Gesamtbetrag</td><td>${fmtPrice(data.total_amount)} EUR</td></tr>
</table>
<p>7. Zahlungsplan:</p>
<ul>
  <li>Anzahlung: <strong>${fmtPrice(data.down_payment)} EUR</strong> bis zum <strong>${fmtDate(data.down_payment_due_date)}</strong></li>
  <li>Restzahlung: <strong>${fmtPrice(data.final_payment)} EUR</strong> bis zum <strong>${fmtDate(data.final_payment_due_date)}</strong></li>
</ul>
<p>8. Bankverbindung: Andreas Grimm und Ben Neuendorf GbR | IBAN: ${fmt(data.bank_iban)} | BIC: ${fmt(data.bank_bic)} | ${fmt(data.bank_name)}</p>

<h2>§ 3 Kaution</h2>
<p>9. Der Mieter hinterlegt bei Übergabe des Fahrzeugs eine Kaution in Höhe von <strong>${fmtPrice(data.deposit_amount)} EUR</strong> in bar oder per Vorab-Überweisung.</p>
<p>10. Die Kaution dient zur Absicherung aller Ansprüche des Vermieters aus diesem Mietverhältnis, insbesondere für Schäden am Fahrzeug, die nicht von der Versicherung gedeckt sind.</p>
<p>11. Die Kaution wird nach ordnungsgemäßer Rückgabe des Fahrzeugs innerhalb von 14 Tagen an den Mieter zurückgezahlt.</p>

<h2>§ 4 Versicherung</h2>
<p>12. Für das Fahrzeug besteht eine Kfz-Haftpflichtversicherung sowie eine Voll- und Teilkaskoversicherung als Selbstfahrvermietfahrzeug.</p>
<p>13. Die Selbstbeteiligung im Schadensfall beträgt:</p>
<ul>
  <li>Vollkaskoversicherung: <strong>${fmtPrice(data.deductible_full_coverage)} EUR</strong></li>
  <li>Teilkaskoversicherung: <strong>${fmtPrice(data.deductible_partial_coverage)} EUR</strong></li>
</ul>
<p>14. Der Mieter haftet für Schäden bis zur Höhe der Selbstbeteiligung, sofern er den Schaden zu vertreten hat. Für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit des Mieters entstehen, haftet der Mieter in voller Höhe.</p>

<h2>§ 5 Nutzung des Fahrzeugs</h2>
<p>15. Das Fahrzeug darf nur vom Mieter und den im Mietvertrag angegebenen weiteren Fahrern geführt werden.</p>
<p>16. Das Mindestalter für alle Fahrer beträgt 25 Jahre. Alle Fahrer müssen seit mindestens 3 Jahren im Besitz einer gültigen Fahrerlaubnis der Klasse B sein.</p>
<p>17. Fahrten sind in folgende Länder gestattet: ${fmt(data.permitted_countries)}. Außerhalb dieser Grenzen besteht in der Kraftfahrversicherung (insbesondere Vollkaskoschutz) kein Versicherungsschutz. Will der Mieter das Fahrzeug in anderen Ländern und Gebieten benutzen, so ist hierzu eine schriftliche vorherige Zustimmung des Vermieters erforderlich.</p>
<p>18. Dem Mieter ist es untersagt, das Fahrzeug zu verwenden:</p>
<ul>
  <li>zur Teilnahme an motorsportlichen Veranstaltungen und Fahrzeugtests,</li>
  <li>zur Beförderung von explosiven, leicht entzündlichen, giftigen, radioaktiven oder sonst gefährlichen Stoffen,</li>
  <li>zur Begehung von Straftaten,</li>
  <li>zur Weitervermietung oder Verleihung.</li>
</ul>

<h2>§ 6 Pflichten des Mieters und Vermieters</h2>
<p>19. Der Vermieter übergibt das Fahrzeug in einem verkehrssicheren, technisch einwandfreien und gereinigten Zustand.</p>
<p>20. Der Mieter ist verpflichtet, das Fahrzeug sorgfältig zu behandeln und nur für den vorgesehenen Zweck zu nutzen sowie die geltenden gesetzlichen Bestimmungen zu beachten.</p>

<h2>§ 7 Verhalten bei Unfall oder Schaden</h2>
<p>22. Der Mieter hat nach einem Unfall, Diebstahl, Brand, Wildschaden oder sonstigem Schaden sofort die Polizei zu verständigen und den Schaden dem Vermieter unverzüglich zu melden.</p>
<p>23. Der Mieter hat alle Maßnahmen zu ergreifen, die der Aufklärung des Schadensereignisses dienen. Dazu gehört insbesondere die Aufnahme der Daten der Unfallbeteiligten und Zeugen sowie die Anfertigung von Fotos und einer Unfallskizze.</p>

<h2>§ 8 Haftung</h2>
<p>24. Der Vermieter haftet nicht für Gegenstände, die der Mieter im Fahrzeug zurücklässt.</p>
<p>25. Der Mieter haftet für alle von ihm zu vertretenden Schäden am Fahrzeug und für den Verlust des Fahrzeugs. Die Haftung ist auf die Höhe der Selbstbeteiligung der Kaskoversicherung begrenzt, es sei denn, der Schaden wurde vorsätzlich oder grob fahrlässig verursacht.</p>
<p>26. Der Mieter haftet unbeschränkt für alle von ihm während der Mietzeit begangenen Verstöße gegen gesetzliche Bestimmungen, insbesondere Verkehrs- und Ordnungswidrigkeiten.</p>

<h2>§ 9 Stornierung</h2>
<p>Bei Rücktritt des Mieters vom Vertrag vor dem vereinbarten Mietbeginn sind die folgenden Stornogebühren zu zahlen:</p>
<ul>
  <li>bis 45 Tage vor Mietbeginn: 30 %</li>
  <li>44–15 Tage vor Mietbeginn: 60 %</li>
  <li>14–8 Tage vor Mietbeginn: 75 %</li>
  <li>7–1 Tag vor Mietbeginn: 90 %</li>
  <li>am Tag der Anmietung oder bei Nichtabnahme: 95 %</li>
</ul>
<p>Dem Mieter bleibt ausdrücklich der Nachweis vorbehalten, dass dem Vermieter kein oder ein wesentlich geringerer Schaden entstanden ist.</p>

<h2>§ 10 Übergabe und Rückgabe</h2>
<p>27. Bei Übergabe und Rückgabe des Fahrzeugs wird von den Parteien gemeinsam ein Protokoll erstellt und unterzeichnet, in dem der Zustand des Fahrzeugs, der Kilometerstand, der Tankfüllstand und eventuelle Mängel oder Schäden festgehalten werden.</p>
<p>28. Erfolgt die Rückgabe des Fahrzeugs nach der vereinbarten Zeit, so ist der Vermieter berechtigt, für jede angefangene Stunde <strong>${fmtPrice(data.fee_late_return_per_hour || 29)} EUR</strong> zu berechnen.</p>

<h2>§ 11 Rückgabezustand, verspätete Rückgabe und sonstige Gebühren</h2>
<p>29. <strong>Rückgabezustand und Reinigung:</strong><br>
Der Mieter ist verpflichtet, das Fahrzeug in einem ordnungsgemäßen, besenreinen Zustand zurückzugeben. Dies beinhaltet die Entfernung aller persönlichen Gegenstände, die Entsorgung von Müll und das Auskehren des Innenraums. Die Toilette (WC-Kassette) sowie der Abwassertank müssen vom Mieter vor der Rückgabe fachgerecht entleert und gereinigt werden.<br>
Kommt der Mieter diesen Verpflichtungen nicht nach, fallen folgende Servicegebühren an, die von der Kaution einbehalten oder separat in Rechnung gestellt werden können:</p>
<ul>
  <li>a) Professionelle Innenreinigung: Sollte das Fahrzeug über den Zustand "besenrein" hinaus verschmutzt sein und eine professionelle Endreinigung durch den Vermieter erfordern, wird eine Pauschale von <strong>${fmtPrice(data.fee_professional_cleaning || 139)} EUR</strong> berechnet.</li>
  <li>b) Toiletten- und Abwasserentsorgung: Für die Entleerung und Reinigung der nicht entleerten WC-Kassette und/oder des Abwassertanks durch den Vermieter wird eine Gebühr von <strong>${fmtPrice(data.fee_toilet_disposal || 200)} EUR</strong> erhoben.</li>
</ul>
<p>30. <strong>Verspätete Rückgabe:</strong><br>
Die Rückgabe des Fahrzeugs hat zum vertraglich vereinbarten Zeitpunkt zu erfolgen. Bei einer vom Mieter zu vertretenden verspäteten Rückgabe wird für jede angefangene Stunde eine Vertragsstrafe von <strong>${fmtPrice(data.fee_late_return_per_hour || 29)} EUR</strong> fällig. Der Vermieter behält sich die Geltendmachung eines darüberhinausgehenden Schadens (z.B. durch die verspätete Weitervermietung an einen Nachmieter) ausdrücklich vor. Die verspätete Rückgabe führt nicht zu einer Verlängerung des Mietverhältnisses oder des Versicherungsschutzes.</p>
<p>31. <strong>Buchungsänderungen:</strong><br>
Jede vom Mieter gewünschte Änderung einer bestätigten Buchung (z.B. Änderung des Mietzeitraums) bedarf der schriftlichen Zustimmung des Vermieters. Für jede durchgeführte Umbuchung wird eine Bearbeitungsgebühr in Höhe von <strong>${fmtPrice(data.fee_booking_change || 21)} EUR</strong> erhoben.</p>
<p>32. <strong>Rauchverbot:</strong><br>
In allen Fahrzeugen des Vermieters herrscht ein absolutes Rauchverbot. Dies gilt für Zigaretten, Zigarren, Pfeifen, E-Zigaretten und jede andere Form des Rauchens oder Dampfens. Das Rauchverbot erstreckt sich auf den gesamten Innenraum des Fahrzeugs, einschließlich aller Räume, Schränke und Lüftungssysteme.<br>
Sollte der Mieter oder eine von ihm verantwortete Person gegen dieses Rauchverbot verstoßen, wird eine zusätzliche Reinigungsgebühr in Höhe von <strong>${fmtPrice(data.fee_smoking_violation || 1000)} EUR</strong> fällig. Diese Gebühr wird von der Kaution einbehalten oder separat in Rechnung gestellt und dient der professionellen Geruchsentfernung und Reinigung des Fahrzeugs. Der Vermieter behält sich das Recht vor, weitere Schadensersatzansprüche geltend zu machen, falls das Fahrzeug durch das Rauchen beschädigt wird (z.B. Brandlöcher, Verfärbungen).</p>
<p>33. <strong>Kilometerregelung:</strong><br>
Das Fahrzeug wird dem Mieter mit einem bestimmten Kilometerstand übergeben. Der Kilometerstand wird bei Abholung und Rückgabe im Übergabeprotokoll dokumentiert. In der Mietgebühr sind <strong>${fmt(data.included_km || 250)} Kilometer pro Miettag</strong> enthalten. Dies entspricht einer Gesamtkilometerzahl, die sich aus der Anzahl der Miettage multipliziert mit ${fmt(data.included_km || 250)} km errechnet.<br>
Für jeden Kilometer, der diese Freikilometerzahl überschreitet, wird eine Gebühr von <strong>${data.extra_km_rate || '0,35'} EUR pro Kilometer</strong> berechnet. Diese Gebühren werden von der Kaution einbehalten oder separat in Rechnung gestellt.<br>
Alternativ bietet der Vermieter dem Mieter die Option, unbegrenzte Kilometer gegen eine zusätzliche Gebühr von <strong>${fmtPrice(data.unlimited_km_fee || 240)} EUR</strong> pro Mietvertrag zu buchen. Diese Option muss im Buchungsvorgang dazu gebucht werden und gilt dann für die gesamte Mietdauer. Mit dieser Option entfallen alle Mehrkilometerkosten.</p>
<p>34. <strong>Kraftstoff und Tankregelung:</strong><br>
Das Fahrzeug wird dem Mieter mit vollgefülltem Kraftstofftank übergeben. Der Mieter ist verpflichtet, das Fahrzeug mit vollgefülltem Kraftstofftank zurückzugeben. Der Tankstand wird bei Abholung und Rückgabe im Übergabeprotokoll dokumentiert.<br>
Sollte das Fahrzeug nicht vollgetankt zurückgegeben werden, behält sich der Vermieter das Recht vor, das Fahrzeug selbst zu tanken und die tatsächlich entstandenen Kosten zuzüglich einer Pauschalgebühr von <strong>${fmtPrice(data.fee_refueling || 35)} EUR</strong> für Aufwand und Fahrtkosten in Rechnung zu stellen. Diese Gebühren werden von der Kaution einbehalten oder separat in Rechnung gestellt.</p>

<h2>§ 12 Schlussbestimmungen</h2>
<p>35. Änderungen und Ergänzungen dieses Vertrages bedürfen der Schriftform. Dies gilt auch für die Aufhebung dieses Schriftformerfordernisses.</p>
<p>36. Sollten einzelne Bestimmungen dieses Vertrages unwirksam oder undurchführbar sein oder werden, so wird dadurch die Wirksamkeit der übrigen Bestimmungen nicht berührt.</p>
<p>37. Ausschließlicher Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Würzburg.</p>

<p style="margin-top:8mm;">Würzburg, den ${fmtDate(data.signature_date || new Date())}</p>

<div class="signatures">
  <div class="sig-box">
    ${data.signature_landlord ? `<img src="${data.signature_landlord}" style="max-height:20mm;margin-bottom:2mm;" /><br>` : '<div style="height:20mm;"></div>'}
    <p><strong>Unterschrift Vermieter</strong><br>Andreas Grimm / Ben Neuendorf<br>Orcacampers</p>
  </div>
  <div class="sig-box">
    ${data.signature_customer ? `<img src="${data.signature_customer}" style="max-height:20mm;margin-bottom:2mm;" /><br>` : '<div style="height:20mm;"></div>'}
    <p><strong>Unterschrift Mieter</strong><br>${fmt(data.customer_name)}</p>
  </div>
</div>

</body>
</html>`

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
