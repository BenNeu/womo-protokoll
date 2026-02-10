import { supabase } from './supabaseClient'

export const autoCreateContractFromBooking = async (rentalId) => {
  try {
    console.log('🔄 Starte Auto-Vertragserstellung für Rental:', rentalId)
    
    // 1. Prüfe ob Vertrag bereits existiert
    const { data: existingContract } = await supabase
      .from('OrcaCampers_rental_contracts')
      .select('id, contract_number')
      .eq('rental_id', rentalId)
      .single()

    if (existingContract) {
      console.log('✅ Vertrag existiert bereits:', existingContract.contract_number)
      return existingContract
    }

    // 2. Hole Buchungsdaten mit Fahrzeug
    const { data: rental, error: rentalError } = await supabase
      .from('OrcaCampers_rentals')
      .select(`
        *,
        OrcaCampers_vehicles (*)
      `)
      .eq('id', rentalId)
      .single()

    if (rentalError) throw rentalError
    if (!rental) throw new Error('Buchung nicht gefunden')

    console.log('📦 Buchungsdaten geladen:', rental.rental_number)

    // 3. Berechne Tage
    const startDate = new Date(rental.rental_start_date)
    const endDate = new Date(rental.rental_end_date)
    const rentalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))

    // 4. Berechne Preise
    const vehicle = rental.OrcaCampers_vehicles
    const dailyRate = rental.daily_rate || vehicle?.daily_rate_default || 150.00
    const rentalTotal = dailyRate * rentalDays
    const serviceFee = rental.service_fee || 50.00
    const depositAmount = rental.deposit_amount || vehicle?.deposit_amount || 1500.00
    const totalAmount = rentalTotal + serviceFee

    // Anzahlung (30%) und Restzahlung
    const downPayment = Math.round(totalAmount * 0.3 * 100) / 100
    const finalPayment = totalAmount - downPayment

    // Fälligkeitsdaten
    const downPaymentDueDate = new Date(startDate)
    downPaymentDueDate.setDate(downPaymentDueDate.getDate() - 14)
    const finalPaymentDueDate = new Date(startDate)
    finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() - 1)

    // 5. Erstelle Vertrag mit allen Daten
    const contractData = {
      rental_id: rentalId,
      vehicle_id: rental.vehicle_id,
      contract_number: `WM-${Date.now()}`,
      
      customer_name: rental.customer_name || '',
      customer_email: rental.customer_email || '',
      customer_phone: rental.customer_phone || '',
      customer_address: rental.customer_address || '',
      customer_id_number: rental.customer_id_number || '',
      customer_drivers_license: rental.customer_drivers_license || '',
      
      vehicle_manufacturer: vehicle?.manufacturer || '',
      vehicle_model: vehicle?.model || '',
      vehicle_registration: rental.vehicle_license_plate || vehicle?.license_plate || '',
      vehicle_vin: vehicle?.vin || '',
      rental_start_mileage: vehicle?.mileage || 0,
      vehicle_equipment: vehicle?.equipment ? vehicle.equipment.join(', ') : 'Standardausstattung',
      
      rental_start_date: rental.rental_start_date,
      rental_end_date: rental.rental_end_date,
      rental_start_time: '10:00',
      rental_end_time: '10:00',
      rental_days: rentalDays,
      
      daily_rate: dailyRate,
      service_fee: serviceFee,
      total_amount: totalAmount,
      deposit_amount: depositAmount,
      
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
      
      additional_drivers: rental.additional_drivers || [],
      permitted_countries: 'EU (ohne Zypern), Albanien, Andorra, Großbritannien, Schottland, Liechtenstein, Monaco, Norwegen, San Marino, Schweiz',
      
      fee_professional_cleaning: 139.00,
      fee_toilet_disposal: 200.00,
      fee_late_return_per_hour: 29.00,
      fee_booking_change: 21.00,
      fee_smoking_violation: 300.00,
      fee_refueling: 35.00,
      
      included_km: 250,
      extra_km_rate: 0.35,
      unlimited_km_option: rental.unlimited_km_option || false,
      unlimited_km_fee: 240.00,
      
      status: 'draft',
      signed_by_landlord: false,
      signed_by_tenant: false
    }

    // 6. Speichere Vertrag
    const { data: newContract, error: contractError } = await supabase
      .from('OrcaCampers_rental_contracts')
      .insert(contractData)
      .select()
      .single()

    if (contractError) throw contractError

    console.log('✅ Vertrag automatisch erstellt:', newContract.contract_number)
    return newContract

  } catch (error) {
    console.error('❌ Fehler bei Auto-Vertragserstellung:', error)
    throw error
  }
}

export const syncConfirmedBookings = async () => {
  try {
    console.log('🔄 Synchronisiere bestätigte Buchungen...')
    
    const { data: confirmedBookings, error } = await supabase
      .from('OrcaCampers_rentals')
      .select('id, rental_number')
      .eq('status', 'confirmed')

    if (error) throw error

    console.log(`📦 ${confirmedBookings?.length || 0} bestätigte Buchungen gefunden`)

    if (!confirmedBookings || confirmedBookings.length === 0) {
      console.log('ℹ️ Keine bestätigten Buchungen zum Synchronisieren')
      return true
    }

    for (const booking of confirmedBookings) {
      try {
        await autoCreateContractFromBooking(booking.id)
      } catch (error) {
        console.error(`❌ Fehler bei Buchung ${booking.rental_number}:`, error)
      }
    }

    console.log('✅ Synchronisation abgeschlossen')
    return true

  } catch (error) {
    console.error('❌ Fehler bei Synchronisation:', error)
    return false
  }
}