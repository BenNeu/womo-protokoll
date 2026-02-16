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
      return new Date(dateStr).toLocaleDateString('de-DE')
    }
    const html = `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><style>* { margin: 0; padding: 0; box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.5; padding: 20mm; } h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-bottom: 6mm; } h2 { font-size: 12pt; font-weight: bold; margin-top: 6mm; margin-bottom: 3mm; } p { margin-bottom: 2mm; } .parties { display: flex; gap: 10mm; margin: 6mm 0; } .party-box { flex: 1; border: 1px solid #ccc; border-radius: 4px; padding: 4mm; background: #f9f9f9; } table { width: 100%; border-collapse: collapse; margin: 3mm 0; } th { background: #f0f0f0; padding: 2mm 3mm; text-align: left; border: 1px solid #ddd; } td { padding: 2mm 3mm; border: 1px solid #ddd; } ul { padding-left: 8mm; margin: 2mm 0; } ul li { margin-bottom: 1mm; } .signatures { display: flex; gap: 10mm; margin-top: 10mm; } .sig-box { flex: 1; border-top: 2px solid #333; padding-top: 3mm; } .page-break { page-break-before: always; }</style></head><body>
<h1>Mietvertrag für ein Wohnmobil</h1>
<p style="text-align:center;margin-bottom:4mm;">Vertragsnummer: <strong>${fmt(data.contract_number)}</strong> | Datum: <strong>${fmtDate(data.signature_date || new Date())}</strong></p>
<div class="parties">
<div class="party-box"><strong>Vermieter:</strong><br>Orcacampers<br>Andreas Grimm &amp; Ben Neuendorf GbR<br>Benzstrasse 3, 97209 Veitshöchheim<br>+49 178 641 3873<br>info@orcacampers.de<br><em>– nachfolgend „Vermieter" genannt –</em></div>
<div class="party-box"><strong>Mieter:</strong><br>${fmt(data.customer_name)}<br>${fmt(data.customer_address)}<br>${fmt(data.customer_phone)}<br>${fmt(data.customer_email)}<br>Ausweis-Nr.: ${fmt(data.customer_id_number)}<br>Führerschein-Nr.: ${fmt(data.customer_drivers_license)}<br><em>– nachfolgend „Mieter" genannt –</em></div>
</div>
<h2>§ 1 Mietgegenstand</h2>
<p>1. Der Vermieter vermietet an den Mieter das nachfolgend beschriebene Wohnmobil:</p>
<table><tr><td style="width:45%"><strong>Fahrzeug-Hersteller</strong></td><td>${fmt(data.vehicle_manufacturer)}</td></tr><tr><td><strong>Fahrzeug-Modell</strong></td><td>${fmt(data.vehicle_model)}</td></tr><tr><td><strong>Amtliches Kennzeichen</strong></td><td>${fmt(data.vehicle_license_plate)}</td></tr><tr><td><strong>Fahrzeug-Ident.-Nr. (VIN)</strong></td><td>${fmt(data.vehicle_vin)}</td></tr><tr><td><strong>Kilometerstand bei Übergabe</strong></td><td>${fmt(data.rental_start_mileage)} km</td></tr></table>
<p>2. Ausstattung: ${data.vehicle_equipment || 'Markise, Küchenausstattung, Campingmöbel, Bettwäsche, Handtücher'}</p>
<p>3. Das Fahrzeug wird mit Zulassungsbescheinigung, Versicherungsnachweis und Bedienungsanleitungen übergeben.</p>
<p>4. Bestehende Vorschäden werden in einem separaten Übergabeprotokoll dokumentiert.</p>
<h2>§ 2 Mietzeit und Mietpreis</h2>
<p>5. Die Mietzeit beginnt am <strong>${fmtDate(data.rental_start_date)}</strong> um <strong>${fmt(data.rental_start_time || '14:00')}</strong> Uhr und endet am <strong>${fmtDate(data.rental_end_date)}</strong> um <strong>${fmt(data.rental_end_time || '10:00')}</strong> Uhr.</p>
<p>6. Der Gesamtmietpreis beträgt <strong>${fmtPrice(data.total_amount)} €</strong>:</p>
<table><tr><td>Mietpreis pro Nacht</td><td>${fmtPrice(data.daily_rate)} €</td></tr><tr><td>Anzahl Nächte</td><td>${fmt(data.rental_days)}</td></tr><tr><td>Mietpreis gesamt</td><td>${fmtPrice((data.daily_rate||0)*(data.rental_days||0))} €</td></tr><tr><td><strong>Gesamtbetrag</strong></td><td><strong>${fmtPrice(data.total_amount)} €</strong></td></tr></table>
<p>7. Zahlungsplan:</p>
<ul><li>Anzahlung: <strong>${fmtPrice(data.down_payment)} €</strong> bis zum <strong>${fmtDate(data.down_payment_due_date)}</strong></li><li>Restzahlung: <strong>${fmtPrice(data.final_payment)} €</strong> bis zum <strong>${fmtDate(data.final_payment_due_date)}</strong></li></ul>
<p>8. Bankverbindung: Andreas Grimm und Ben Neuendorf GbR | IBAN: ${fmt(data.bank_iban)} | BIC: ${fmt(data.bank_bic)} | ${fmt(data.bank_name)}</p>
<h2>§ 3 Kaution</h2>
<p>9. Der Mieter hinterlegt eine Kaution von <strong>${fmtPrice(data.deposit_amount)} €</strong> bei Übergabe des Fahrzeugs.</p>
<p>10. Die Kaution wird nach ordnungsgemäßer Rückgabe innerhalb von 14 Tagen zurückgezahlt.</p>
<h2>§ 4 Versicherung</h2>
<p>12. Für das Fahrzeug besteht Kfz-Haftpflicht sowie Voll- und Teilkaskoversicherung als Selbstfahrvermietfahrzeug.</p>
<p>13. Selbstbeteiligung: Vollkasko <strong>${fmtPrice(data.deductible_full_coverage)} €</strong> | Teilkasko <strong>${fmtPrice(data.deductible_partial_coverage)} €</strong></p>
<h2 class="page-break">§ 5 Nutzung des Fahrzeugs</h2>
<p>15. Das Fahrzeug darf nur vom Mieter und angegebenen weiteren Fahrern geführt werden.</p>
<p>16. Mindestalter 25 Jahre, Führerschein Klasse B seit mindestens 3 Jahren.</p>
<p>17. Erlaubte Länder: ${fmt(data.permitted_countries)}</p>
<p>18. Verboten: Motorsport, gefährliche Stoffe, Straftaten, Weitervermietung.</p>
<h2>§ 6 Pflichten</h2>
<p>19. Der Vermieter übergibt das Fahrzeug in verkehrssicherem, gereinigtem Zustand.</p>
<p>20. Der Mieter behandelt das Fahrzeug sorgfältig und beachtet alle gesetzlichen Bestimmungen.</p>
<h2>§ 7 Unfall oder Schaden</h2>
<p>22. Bei Unfall sofort Polizei verständigen und Schaden dem Vermieter melden.</p>
<p>23. Daten der Beteiligten aufnehmen, Fotos und Unfallskizze anfertigen.</p>
<h2>§ 8 Haftung</h2>
<p>24. Der Vermieter haftet nicht für zurückgelassene Gegenstände.</p>
<p>25. Mieterhaftung begrenzt auf Selbstbeteiligung, außer bei Vorsatz oder grober Fahrlässigkeit.</p>
<h2>§ 9 Stornierung</h2>
<table><tr><th>Zeitraum vor Mietbeginn</th><th>Stornogebühr</th></tr><tr><td>bis zu 30 Tage</td><td>30 %</td></tr><tr><td>29. bis 8. Tag</td><td>35 %</td></tr><tr><td>ab dem 7. Tag</td><td>40 %</td></tr><tr><td>Am Anmiettag / Nichtabnahme</td><td>95 %</td></tr></table>
<h2>§ 10 Übergabe und Rückgabe</h2>
<p>27. Bei Übergabe und Rückgabe wird gemeinsam ein Protokoll erstellt.</p>
<p>28. Verspätete Rückgabe: <strong>${fmtPrice(data.fee_late_return_per_hour||29)} €</strong> je angefangener Stunde.</p>
<h2 class="page-break">§ 11 Sonstige Gebühren</h2>
<ul><li>Professionelle Innenreinigung: <strong>${fmtPrice(data.fee_professional_cleaning||139)} €</strong></li><li>Toiletten-/Abwasserentsorgung: <strong>${fmtPrice(data.fee_toilet_disposal||200)} €</strong></li><li>Buchungsänderung: <strong>${fmtPrice(data.fee_booking_change||21)} €</strong></li><li>Rauchverbot-Verstoß: <strong>${fmtPrice(data.fee_smoking_violation||1000)} €</strong></li><li>Nachtanken: Kosten + Pauschale <strong>${fmtPrice(data.fee_refueling||35)} €</strong></li></ul>
<p>Kilometerregelung: <strong>${fmt(data.included_km||250)} km/Miettag</strong> inklusive. Mehrkilometer: <strong>${data.extra_km_rate||'0,35'} €/km</strong>. Unbegrenzte km: <strong>${fmtPrice(data.unlimited_km_fee||240)} €</strong> Aufpreis.</p>
<h2>§ 12 Schlussbestimmungen</h2>
<p>35. Änderungen bedürfen der Schriftform.</p>
<p>36. Unwirksamkeit einzelner Bestimmungen berührt nicht die Wirksamkeit der übrigen.</p>
<p>37. Gerichtsstand: Würzburg.</p>
<p style="margin-top:8mm;">Würzburg, den ${fmtDate(data.signature_date || new Date())}</p>
<div class="signatures">
<div class="sig-box">${data.signature_landlord ? '<img src="'+data.signature_landlord+'" style="max-height:20mm;margin-bottom:2mm;" /><br>' : '<div style="height:20mm;"></div>'}<p><strong>Unterschrift Vermieter</strong><br>Andreas Grimm / Ben Neuendorf</p></div>
<div class="sig-box">${data.signature_customer ? '<img src="'+data.signature_customer+'" style="max-height:20mm;margin-bottom:2mm;" /><br>' : '<div style="height:20mm;"></div>'}<p><strong>Unterschrift Mieter</strong><br>${fmt(data.customer_name)}</p></div>
</div>
</body></html>`
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(html)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
