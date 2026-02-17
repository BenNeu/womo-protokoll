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

<h1>Mietvertrag fuer ein Wohnmobil</h1>
<p style="text-align:center;margin-bottom:4mm;">Vertragsnummer: <strong>${fmt(data.contract_number)}</strong> | Datum: <strong>${fmtDate(data.signature_date || new Date())}</strong></p>
<p style="text-align:center;margin-bottom:6mm;">zwischen</p>

<div class="parties">
  <div class="party-box">
    <strong>Vermieter:</strong>
    Orcacampers<br>
    Andreas Grimm &amp; Ben Neuendorf GbR<br>
    Benzstrasse 3, 97209 Veitshoechheim<br>
    +49 178 641 3873<br>
    info@orcacampers.de
    <br><em style="font-size:9pt;color:#666;">- nachfolgend Vermieter genannt -</em>
  </div>
  <div class="party-box">
    <strong>Mieter:</strong>
    ${fmt(data.customer_name)}<br>
    ${fmt(data.customer_address)}<br>
    ${fmt(data.customer_phone)}<br>
    ${fmt(data.customer_email)}<br>
    Ausweis-Nr.: ${fmt(data.customer_id_number)}<br>
    Fuehrerschein-Nr.: ${fmt(data.customer_drivers_license)}
    <br><em style="font-size:9pt;color:#666;">- nachfolgend Mieter genannt -</em>
  </div>
</div>

<h2>§ 1 Mietgegenstand</h2>
<p>1. Der Vermieter vermietet an den Mieter das nachfolgend beschriebene Wohnmobil:</p>
<table>
  <tr><td style="width:45%"><strong>Fahrzeug-Hersteller</strong></td><td>${fmt(data.vehicle_manufacturer)}</td></tr>
  <tr><td><strong>Fahrzeug-Modell</strong></td><td>${fmt(data.vehicle_model)}</td></tr>
  <tr><td><strong>Amtliches Kennzeichen</strong></td><td>${fmt(data.vehicle_license_plate)}</td></tr>
  <tr><td><strong>Fahrzeug-Ident.-Nr. (VIN)</strong></td><td>${fmt(data.vehicle_vin)}</td></tr>
  <tr><td><strong>Kilometerstand bei Uebergabe</strong></td><td>${fmt(data.rental_start_mileage)} km</td></tr>
</table>
<p>2. Ausstattung: ${fmt(data.vehicle_equipment)}</p>
<p>3. Das Fahrzeug wird mit Zulassungsbescheinigung, Versicherungsnachweis und Bedienungsanleitungen uebergeben.</p>
<p>4. Bestehende Vorschaeden werden in einem separaten Uebergabeprotokoll dokumentiert.</p>

<h2>§ 2 Mietzeit und Mietpreis</h2>
<p>5. Die Mietzeit beginnt am <strong>${fmtDate(data.rental_start_date)}</strong> um <strong>${fmt(data.rental_start_time || '14:00')}</strong> Uhr und endet am <strong>${fmtDate(data.rental_end_date)}</strong> um <strong>${fmt(data.rental_end_time || '10:00')}</strong> Uhr.</p>
<p>6. Der Gesamtmietpreis betraegt <strong>${fmtPrice(data.total_amount)} EUR</strong>:</p>
<table>
  <tr><td>Mietpreis pro Nacht</td><td>${fmtPrice(data.daily_rate)} EUR</td></tr>
  <tr><td>Anzahl Naechte</td><td>${fmt(data.rental_days)}</td></tr>
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
<p>9. Der Mieter hinterlegt bei Uebergabe des Fahrzeugs eine Kaution in Hoehe von <strong>${fmtPrice(data.deposit_amount)} EUR</strong> in bar oder per Vorab-Ueberweisung.</p>
<p>10. Die Kaution dient zur Absicherung aller Ansprueche des Vermieters aus diesem Mietverhaeltnis, insbesondere fuer Schaeden am Fahrzeug, die nicht von der Versicherung gedeckt sind.</p>
<p>11. Die Kaution wird nach ordnungsgemaesser Rueckgabe des Fahrzeugs innerhalb von 14 Tagen an den Mieter zurueckgezahlt.</p>

<h2>§ 4 Versicherung</h2>
<p>12. Fuer das Fahrzeug besteht eine Kfz-Haftpflichtversicherung sowie eine Voll- und Teilkaskoversicherung als Selbstfahrvermietfahrzeug.</p>
<p>13. Die Selbstbeteiligung im Schadensfall betraegt:</p>
<ul>
  <li>Vollkaskoversicherung: <strong>${fmtPrice(data.deductible_full_coverage)} EUR</strong></li>
  <li>Teilkaskoversicherung: <strong>${fmtPrice(data.deductible_partial_coverage)} EUR</strong></li>
</ul>
<p>14. Der Mieter haftet fuer Schaeden bis zur Hoehe der Selbstbeteiligung, sofern er den Schaden zu vertreten hat. Fuer Schaeden, die durch Vorsatz oder grobe Fahrlaessigkeit des Mieters entstehen, haftet der Mieter in voller Hoehe.</p>

<h2>§ 5 Nutzung des Fahrzeugs</h2>
<p>15. Das Fahrzeug darf nur vom Mieter und den im Mietvertrag angegebenen weiteren Fahrern gefuehrt werden.</p>
<p>16. Das Mindestalter fuer alle Fahrer betraegt 25 Jahre. Alle Fahrer muessen seit mindestens 3 Jahren im Besitz einer gueltigen Fahrerlaubnis der Klasse B sein.</p>
<p>17. Fahrten sind in folgende Laender gestattet: ${fmt(data.permitted_countries)}. Außerhalb dieser Grenzen besteht in der Kraftfahrversicherung (insbesondere Vollkaskoschutz) kein Versicherungsschutz. Will der Mieter das Fahrzeug in anderen Laendern und Gebieten benutzen, so ist hierzu eine schriftliche vorherige Zustimmung des Vermieters erforderlich.</p>
<p>18. Dem Mieter ist es untersagt, das Fahrzeug zu verwenden:</p>
<ul>
  <li>zur Teilnahme an motorsportlichen Veranstaltungen und Fahrzeugtests,</li>
  <li>zur Befoerderung von explosiven, leicht entzuendlichen, giftigen, radioaktiven oder sonst gefaehrlichen Stoffen,</li>
  <li>zur Begehung von Straftaten,</li>
  <li>zur Weitervermietung oder Verleihung.</li>
</ul>

<h2>§ 6 Pflichten des Mieters und Vermieters</h2>
<p>19. Der Vermieter uebergibt das Fahrzeug in einem verkehrssicheren, technisch einwandfreien und gereinigten Zustand.</p>
<p>20. Der Mieter ist verpflichtet, das Fahrzeug sorgfaeltig zu behandeln und nur fuer den vorgesehenen Zweck zu nutzen sowie die geltenden gesetzlichen Bestimmungen zu beachten.</p>

<h2>§ 7 Verhalten bei Unfall oder Schaden</h2>
<p>22. Der Mieter hat nach einem Unfall, Diebstahl, Brand, Wildschaden oder sonstigem Schaden sofort die Polizei zu verstaendigen und den Schaden dem Vermieter unverzueglich zu melden.</p>
<p>23. Der Mieter hat alle Massnahmen zu ergreifen, die der Aufklaerung des Schadensereignisses dienen. Dazu gehoert insbesondere die Aufnahme der Daten der Unfallbeteiligten und Zeugen sowie die Anfertigung von Fotos und einer Unfallskizze.</p>

<h2>§ 8 Haftung</h2>
<p>24. Der Vermieter haftet nicht fuer Gegenstaende, die der Mieter im Fahrzeug zuruecklaesst.</p>
<p>25. Der Mieter haftet fuer alle von ihm zu vertretenden Schaeden am Fahrzeug und fuer den Verlust des Fahrzeugs. Die Haftung ist auf die Hoehe der Selbstbeteiligung der Kaskoversicherung begrenzt, es sei denn, der Schaden wurde vorsaetzlich oder grob fahrlaessig verursacht.</p>
<p>26. Der Mieter haftet unbeschraenkt fuer alle von ihm waehrend der Mietzeit begangenen Verstoesse gegen gesetzliche Bestimmungen, insbesondere Verkehrs- und Ordnungswidrigkeiten.</p>

<h2>§ 9 Stornierung</h2>
<p>Bei Ruecktritt des Mieters vom Vertrag vor dem vereinbarten Mietbeginn sind folgende Stornogeboehren zu zahlen:</p>
<table>
  <tr><th>Zeitraum vor Mietbeginn</th><th>Stornogeboehr</th></tr>
  <tr><td>bis zu 30 Tage</td><td>30 % des Mietpreises</td></tr>
  <tr><td>29. bis 8. Tag</td><td>35 % des Mietpreises</td></tr>
  <tr><td>ab dem 7. Tag</td><td>40 % des Mietpreises</td></tr>
  <tr><td>Am Anmiettag / Nichtabnahme</td><td>95 % des Mietpreises</td></tr>
</table>

<h2>§ 10 Uebergabe und Rueckgabe</h2>
<p>27. Bei Uebergabe und Rueckgabe des Fahrzeugs wird von den Parteien gemeinsam ein Protokoll erstellt und unterzeichnet, in dem der Zustand des Fahrzeugs, der Kilometerstand, der Tankfuellstand und eventuelle Maengel oder Schaeden festgehalten werden.</p>
<p>28. Erfolgt die Rueckgabe des Fahrzeugs nach der vereinbarten Zeit, so ist der Vermieter berechtigt, fuer jede angefangene Stunde <strong>${fmtPrice(data.fee_late_return_per_hour || 29)} EUR</strong> zu berechnen.</p>

<h2>§ 11 Rueckgabezustand, verspaetete Rueckgabe und sonstige Gebuehren</h2>
<p>29. <strong>Rueckgabezustand und Reinigung:</strong><br>
Der Mieter ist verpflichtet, das Fahrzeug in einem ordnungsgemaessen, besenreinen Zustand zurueckzugeben. Dies beinhaltet die Entfernung aller persoenlichen Gegenstaende, die Entsorgung von Muell und das Auskehren des Innenraums. Die Toilette (WC-Kassette) sowie der Abwassertank muessen vom Mieter vor der Rueckgabe fachgerecht entleert und gereinigt werden.<br>
Kommt der Mieter diesen Verpflichtungen nicht nach, fallen folgende Servicegebuehren an, die von der Kaution einbehalten oder separat in Rechnung gestellt werden koennen:</p>
<ul>
  <li>a) Professionelle Innenreinigung: Sollte das Fahrzeug ueber den Zustand "besenrein" hinaus verschmutzt sein und eine professionelle Endreinigung durch den Vermieter erfordern, wird eine Pauschale von <strong>${fmtPrice(data.fee_professional_cleaning || 139)} EUR</strong> berechnet.</li>
  <li>b) Toiletten- und Abwasserentsorgung: Fuer die Entleerung und Reinigung der nicht entleerten WC-Kassette und/oder des Abwassertanks durch den Vermieter wird eine Gebuehr von <strong>${fmtPrice(data.fee_toilet_disposal || 200)} EUR</strong> erhoben.</li>
</ul>
<p>30. <strong>Verspaetete Rueckgabe:</strong><br>
Die Rueckgabe des Fahrzeugs hat zum vertraglich vereinbarten Zeitpunkt zu erfolgen. Bei einer vom Mieter zu vertretenden verspaeteten Rueckgabe wird fuer jede angefangene Stunde eine Vertragsstrafe von <strong>${fmtPrice(data.fee_late_return_per_hour || 29)} EUR</strong> faellig. Der Vermieter behaelt sich die Geltendmachung eines darueberhingausgehenden Schadens (z.B. durch die verspaetete Weitervermietung an einen Nachmieter) ausdruecklich vor. Die verspaetete Rueckgabe fuehrt nicht zu einer Verlaengerung des Mietverhaeltnisses oder des Versicherungsschutzes.</p>
<p>31. <strong>Buchungsaenderungen:</strong><br>
Jede vom Mieter gewuenschte Aenderung einer bestaetigten Buchung (z.B. Aenderung des Mietzeitraums) bedarf der schriftlichen Zustimmung des Vermieters. Fuer jede durchgefuehrte Umbuchung wird eine Bearbeitungsgebuehr in Hoehe von <strong>${fmtPrice(data.fee_booking_change || 21)} EUR</strong> erhoben.</p>
<p>32. <strong>Rauchverbot:</strong><br>
In allen Fahrzeugen des Vermieters herrscht ein absolutes Rauchverbot. Dies gilt fuer Zigaretten, Zigarren, Pfeifen, E-Zigaretten und jede andere Form des Rauchens oder Dampfens. Das Rauchverbot erstreckt sich auf den gesamten Innenraum des Fahrzeugs, einschliesslich aller Raeume, Schraenke und Lueftungssysteme.<br>
Sollte der Mieter oder eine von ihm verantwortete Person gegen dieses Rauchverbot verstossen, wird eine zusaetzliche Reinigungsgebuehr in Hoehe von <strong>${fmtPrice(data.fee_smoking_violation || 1000)} EUR</strong> faellig. Diese Gebuehr wird von der Kaution einbehalten oder separat in Rechnung gestellt und dient der professionellen Geruchsentfernung und Reinigung des Fahrzeugs. Der Vermieter behaelt sich das Recht vor, weitere Schadensersatzansprueche geltend zu machen, falls das Fahrzeug durch das Rauchen beschaedigt wird (z.B. Brandloecher, Verfaerbungen).</p>
<p>33. <strong>Kilometerregelung:</strong><br>
Das Fahrzeug wird dem Mieter mit einem bestimmten Kilometerstand uebergeben. Der Kilometerstand wird bei Abholung und Rueckgabe im Uebergabeprotokoll dokumentiert. In der Mietgebuehr sind <strong>${fmt(data.included_km || 250)} Kilometer pro Miettag</strong> enthalten. Dies entspricht einer Gesamtkilometerzahl, die sich aus der Anzahl der Miettage multipliziert mit ${fmt(data.included_km || 250)} km errechnet.<br>
Fuer jeden Kilometer, der diese Freikilometerzahl ueberschreitet, wird eine Gebuehr von <strong>${data.extra_km_rate || '0,35'} EUR pro Kilometer</strong> berechnet. Diese Gebuehren werden von der Kaution einbehalten oder separat in Rechnung gestellt.<br>
Alternativ bietet der Vermieter dem Mieter die Option, unbegrenzte Kilometer gegen eine zusaetzliche Gebuehr von <strong>${fmtPrice(data.unlimited_km_fee || 240)} EUR</strong> pro Mietvertrag zu buchen. Diese Option muss im Buchungsvorgang dazu gebucht werden und gilt dann fuer die gesamte Mietdauer. Mit dieser Option entfallen alle Mehrkilometerkosten.</p>
<p>34. <strong>Kraftstoff und Tankregelung:</strong><br>
Das Fahrzeug wird dem Mieter mit vollgefuelltem Kraftstofftank uebergeben. Der Mieter ist verpflichtet, das Fahrzeug mit vollgefuelltem Kraftstofftank zurueckzugeben. Der Tankstand wird bei Abholung und Rueckgabe im Uebergabeprotokoll dokumentiert.<br>
Sollte das Fahrzeug nicht vollgetankt zurueckgegeben werden, behaelt sich der Vermieter das Recht vor, das Fahrzeug selbst zu tanken und die tatsaechlich entstandenen Kosten zuezueglich einer Pauschalgebuehr von <strong>${fmtPrice(data.fee_refueling || 35)} EUR</strong> fuer Aufwand und Fahrtkosten in Rechnung zu stellen. Diese Gebuehren werden von der Kaution einbehalten oder separat in Rechnung gestellt.</p>

<h2>§ 12 Schlussbestimmungen</h2>
<p>35. Aenderungen und Ergaenzungen dieses Vertrages beduerfen der Schriftform.</p>
<p>36. Sollten einzelne Bestimmungen dieses Vertrages unwirksam oder undurchfuehrbar sein, wird dadurch die Wirksamkeit der uebrigen Bestimmungen nicht beruehrt.</p>
<p>37. Ausschliesslicher Gerichtsstand fuer alle Streitigkeiten aus diesem Vertrag ist Wuerzburg.</p>

<p style="margin-top:8mm;">Wuerzburg, den ${fmtDate(data.signature_date || new Date())}</p>

<div class="signatures">
  <div class="sig-box">
    ${data.signature_landlord ? `<img src="${data.signature_landlord}" style="max-height:20mm;margin-bottom:2mm;" /><br>` : '<div style="height:20mm;"></div>'}
    <p><strong>Unterschrift Vermieter</strong><br>Andreas Grimm / Ben Neuendorf</p>
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