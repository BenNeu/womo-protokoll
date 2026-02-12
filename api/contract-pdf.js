import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const BROWSERLESS_URL = 'http://91.99.70.245:3001'

export default async function handler(req, res) {
  try {
    const { rental_id, contract_id } = req.query

    if (!rental_id && !contract_id) {
      return res.status(400).json({ error: 'rental_id oder contract_id erforderlich' })
    }

    // 1. Vertrag laden
    let query = supabase
      .from('OrcaCampers_rental_contracts')
      .select('*')

    if (contract_id) {
      query = query.eq('id', contract_id)
    } else {
      query = query.eq('rental_id', rental_id)
    }

    const { data: contract, error } = await query.single()

    if (error) throw error
    if (!contract) return res.status(404).json({ error: 'Vertrag nicht gefunden' })

    // 2. Template laden
    const { data: template } = await supabase
      .from('OrcaCampers_contract_templates')
      .select('template_html')
      .eq('is_active', true)
      .single()

    // 3. HTML generieren
    const rentalTotal = (contract.daily_rate || 0) * (contract.rental_days || 0)
    let html = template?.template_html || generateFallbackHTML(contract)

    const replacements = {
      contract_number: contract.contract_number || '',
      signature_date: new Date().toLocaleDateString('de-DE'),
      customer_name: contract.customer_name || '',
      customer_address: contract.customer_address || '',
      customer_phone: contract.customer_phone || '',
      customer_email: contract.customer_email || '',
      customer_id_number: contract.customer_id_number || '',
      customer_drivers_license: contract.customer_drivers_license || '',
      vehicle_manufacturer: contract.vehicle_manufacturer || '',
      vehicle_model: contract.vehicle_model || '',
      vehicle_registration: contract.vehicle_registration || '',
      vehicle_vin: contract.vehicle_vin || '',
      rental_start_mileage: contract.rental_start_mileage || '0',
      vehicle_equipment: contract.vehicle_equipment || 'Standardausstattung',
      rental_start_date: contract.rental_start_date ? new Date(contract.rental_start_date).toLocaleDateString('de-DE') : '',
      rental_end_date: contract.rental_end_date ? new Date(contract.rental_end_date).toLocaleDateString('de-DE') : '',
      rental_start_time: contract.rental_start_time || '14:00',
      rental_end_time: contract.rental_end_time || '10:00',
      rental_days: contract.rental_days || 0,
      daily_rate: contract.daily_rate || 0,
      rental_total: rentalTotal,
      total_amount: contract.total_amount || 0,
      deposit_amount: contract.deposit_amount || 0,
      down_payment: contract.down_payment || 0,
      down_payment_due_date: contract.down_payment_due_date ? new Date(contract.down_payment_due_date).toLocaleDateString('de-DE') : '',
      final_payment: contract.final_payment || 0,
      final_payment_due_date: contract.final_payment_due_date ? new Date(contract.final_payment_due_date).toLocaleDateString('de-DE') : '',
      bank_account_holder: contract.bank_account_holder || 'Andreas Grimm und Ben Neuendorf GbR',
      bank_iban: contract.bank_iban || '',
      bank_bic: contract.bank_bic || '',
      bank_name: contract.bank_name || '',
      insurance_package: contract.insurance_package || 'Vollkasko',
      deductible_full_coverage: contract.deductible_full_coverage || 1500,
      deductible_partial_coverage: contract.deductible_partial_coverage || 1500,
      permitted_countries: contract.permitted_countries || 'EU, Schweiz, Norwegen',
      fee_professional_cleaning: contract.fee_professional_cleaning || 139,
      fee_toilet_disposal: contract.fee_toilet_disposal || 200,
      fee_late_return_per_hour: contract.fee_late_return_per_hour || 29,
      fee_booking_change: contract.fee_booking_change || 21,
      fee_smoking_violation: contract.fee_smoking_violation || 300,
      fee_refueling: contract.fee_refueling || 35,
      included_km: contract.included_km || 250,
      extra_km_rate: contract.extra_km_rate || 0.35,
      unlimited_km_fee: contract.unlimited_km_fee || 240,
      additional_drivers_text: 'Keine weiteren Fahrer',
      additional_services_text: 'Keine',
      signature_tenant: '<p style="color: #999;">Nicht unterschrieben</p>',
      signature_landlord: '<p style="color: #999;">Nicht unterschrieben</p>'
    }

    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, replacements[key])
    })

    // 4. PDF via Browserless generieren
    const browserlessResponse = await fetch(`${BROWSERLESS_URL}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        options: {
          format: 'A4',
          printBackground: true,
          margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        }
      })
    })

    if (!browserlessResponse.ok) {
      throw new Error(`Browserless Fehler: ${browserlessResponse.status}`)
    }

    const pdfBuffer = await browserlessResponse.arrayBuffer()

    // 5. PDF zurückgeben
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="Mietvertrag_${contract.contract_number}.pdf"`)
    res.send(Buffer.from(pdfBuffer))

  } catch (error) {
    console.error('Contract PDF Error:', error)
    res.status(500).json({ error: error.message })
  }
}

function generateFallbackHTML(contract) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
        h1 { color: #667eea; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #eee; border-radius: 8px; }
        .row { margin: 8px 0; }
        .label { font-weight: bold; color: #667eea; display: inline-block; min-width: 200px; }
      </style>
    </head>
    <body>
      <h1>MIETVERTRAG</h1>
      <p style="text-align: center;">Vertragsnummer: ${contract.contract_number}</p>
      
      <div class="section">
        <h2>Kunde</h2>
        <div class="row"><span class="label">Name:</span> ${contract.customer_name}</div>
        <div class="row"><span class="label">Email:</span> ${contract.customer_email || ''}</div>
        <div class="row"><span class="label">Telefon:</span> ${contract.customer_phone || ''}</div>
        <div class="row"><span class="label">Adresse:</span> ${contract.customer_address || ''}</div>
      </div>
      
      <div class="section">
        <h2>Fahrzeug</h2>
        <div class="row"><span class="label">Fahrzeug:</span> ${contract.vehicle_manufacturer} ${contract.vehicle_model}</div>
        <div class="row"><span class="label">Kennzeichen:</span> ${contract.vehicle_registration || ''}</div>
      </div>
      
      <div class="section">
        <h2>Mietdaten</h2>
        <div class="row"><span class="label">Von:</span> ${new Date(contract.rental_start_date).toLocaleDateString('de-DE')} um ${contract.rental_start_time}</div>
        <div class="row"><span class="label">Bis:</span> ${new Date(contract.rental_end_date).toLocaleDateString('de-DE')} um ${contract.rental_end_time}</div>
        <div class="row"><span class="label">Tage:</span> ${contract.rental_days}</div>
        <div class="row"><span class="label">Gesamtpreis:</span> ${contract.total_amount}€</div>
      </div>
      
      <div class="section">
        <h2>Zahlung</h2>
        <div class="row"><span class="label">Anzahlung (30%):</span> ${contract.down_payment}€</div>
        <div class="row"><span class="label">Restzahlung (70%):</span> ${contract.final_payment}€</div>
        <div class="row"><span class="label">IBAN:</span> ${contract.bank_iban || ''}</div>
        <div class="row"><span class="label">Verwendungszweck:</span> ${contract.contract_number}</div>
      </div>
    </body>
    </html>
  `
}