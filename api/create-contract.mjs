import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://supabase.benneuendorf.com',
  'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc0ODAxODEwMCwiZXhwIjo0OTAzNjkxNzAwLCJyb2xlIjoiYW5vbiJ9.7sYj8BXbWTc12HDynzELLxmkcmVVJ_-VRTW-sz02ads'
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { rental_id } = req.body

    if (!rental_id) {
      return res.status(400).json({ error: 'rental_id erforderlich' })
    }

    // 1. Prüfe ob Vertrag bereits existiert
    const { data: existing } = await supabase
      .from('OrcaCampers_rental_contracts')
      .select('id, contract_number')
      .eq('rental_id', rental_id)
      .maybeSingle()

    if (existing) {
      return res.status(200).json({ 
        success: true, 
        contract_id: existing.id,
        contract_number: existing.contract_number,
        created: false
      })
    }

    // 2. Buchungsdaten laden
    const { data: rental, error: rentalError } = await supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .eq('id', rental_id)
      .single()

    if (rentalError || !rental) {
      return res.status(404).json({ error: 'Buchung nicht gefunden' })
    }

    // 3. Preise aus OrcaCampers_pricing laden
    const { data: pricingData } = await supabase
      .from('OrcaCampers_pricing')
      .select('item_key, item_name, price')
      .eq('is_active', true)

    const pricing = {}
    pricingData?.forEach(p => { pricing[p.item_key] = p })

    // 4. Extras zusammenbauen
    const extras = []
    let extrasTotal = 0
    const extraFields = {
      bed_linen: rental.bed_linen,
      camping_set: rental.camping_set,
      kitchen_set: rental.kitchen_set,
      towel_set: rental.towel_set,
      saturday_handover: rental.saturday_handover ? 1 : 0,
      unlimited_km: rental.unlimited_km ? 1 : 0,
      solar_panel: rental.solar_panel
    }

    Object.entries(extraFields).forEach(([key, qty]) => {
      if (qty && qty > 0 && pricing[key]) {
        const lineTotal = parseFloat(pricing[key].price) * qty
        extras.push({
          key,
          name: pricing[key].item_name,
          qty,
          unit_price: parseFloat(pricing[key].price),
          total: lineTotal
        })
        extrasTotal += lineTotal
      }
    })

    // 5. Preise berechnen
    const startDate = new Date(rental.start_date)
    const endDate = new Date(rental.end_date)
    const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    const totalAmount = parseFloat(rental.total_price || 0)
    const downPayment = Math.round(totalAmount * 0.3 * 100) / 100
    const finalPayment = Math.round((totalAmount - downPayment) * 100) / 100

    const downPaymentDueDate = new Date(startDate)
    downPaymentDueDate.setDate(downPaymentDueDate.getDate() - 14)
    const finalPaymentDueDate = new Date(startDate)
    finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() - 1)

    // 6. Vertrag anlegen
    const contractData = {
      rental_id: rental_id,
      contract_number: rental.rental_number,

      customer_name: rental.customer_name || '',
      customer_email: rental.customer_email || '',
      customer_phone: rental.customer_phone || '',
      customer_address: rental.customer_address || '',

      vehicle_manufacturer: rental.vehicle_manufacturer || '',
      vehicle_model: rental.vehicle_model || '',
      vehicle_registration: rental.vehicle_license_plate || '',
      vehicle_vin: rental.vehicle_vin || '',

      rental_start_date: rental.start_date?.split('T')[0],
      rental_end_date: rental.end_date?.split('T')[0],
      rental_start_time: '14:00',
      rental_end_time: '10:00',
      rental_days: rentalDays,

      daily_rate: parseFloat(rental.daily_rate || 0),
      total_amount: totalAmount,
      deposit_amount: 1500.00,
      service_fee: parseFloat(rental.service_fee || 0) || 139.00,

      down_payment: downPayment,
      down_payment_due_date: downPaymentDueDate.toISOString().split('T')[0],
      final_payment: finalPayment,
      final_payment_due_date: finalPaymentDueDate.toISOString().split('T')[0],

      bank_account_holder: 'Andreas Grimm und Ben Neuendorf GbR',
      bank_iban: 'DE89370400440532013000',
      bank_bic: 'COBADEFFXXX',
      bank_name: 'Commerzbank',

      insurance_package: 'Vollkasko',
      deductible_full_coverage: 1500.00,
      deductible_partial_coverage: 1500.00,

      permitted_countries: 'EU (ohne Zypern), Albanien, Andorra, Großbritannien, Liechtenstein, Monaco, Norwegen, San Marino, Schweiz',

      fee_professional_cleaning: 139.00,
      fee_toilet_disposal: 200.00,
      fee_late_return_per_hour: 29.00,
      fee_booking_change: 21.00,
      fee_smoking_violation: 300.00,
      fee_refueling: 35.00,

      included_km: 250,
      extra_km_rate: 0.35,
      unlimited_km_option: rental.unlimited_km === true || rental.unlimited_km === 1,
      unlimited_km_fee: 240.00,

      extras: extras.length > 0 ? extras : null,

      status: 'draft'
    }

    const { data: newContract, error: contractError } = await supabase
      .from('OrcaCampers_rental_contracts')
      .insert(contractData)
      .select()
      .single()

    if (contractError) throw contractError

    return res.status(200).json({
      success: true,
      contract_id: newContract.id,
      contract_number: newContract.contract_number,
      created: true
    })

  } catch (error) {
    console.error('Create Contract Error:', error)
    return res.status(500).json({ error: error.message })
  }
}