import { supabase } from './supabaseClient'
import jsPDF from 'jspdf'

export const generateContractPDF = async (contractId) => {
  try {
    // 1. Vertrag laden
    const { data: contract, error: contractError } = await supabase
      .from('OrcaCampers_rental_contracts')
      .select('*')
      .eq('id', contractId)
      .single()
    
    if (contractError) throw contractError
    
    // 2. Template laden
    const { data: template, error: templateError } = await supabase
      .from('OrcaCampers_contract_templates')
      .select('*')
      .eq('is_active', true)
      .single()
    
    if (templateError) throw templateError
    
    // 3. Unterschriften laden
    const { data: signatures, error: sigError } = await supabase
      .from('OrcaCampers_contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
    
    if (sigError) throw sigError
    
    // 4. Template ausfüllen
    let html = template.template_html
    
    // Zusätzliche Fahrer formatieren
    let additionalDriversText = 'Keine weiteren Fahrer'
    if (contract.additional_drivers && Array.isArray(contract.additional_drivers) && contract.additional_drivers.length > 0) {
      additionalDriversText = contract.additional_drivers.map(driver => 
        `${driver.name}, ${driver.address}, Führerschein-Nr.: ${driver.license}`
      ).join('<br>')
    }
    
    // Zusätzliche Services formatieren
    let additionalServicesText = 'Keine'
    if (contract.additional_services) {
      const services = []
      Object.keys(contract.additional_services).forEach(key => {
        services.push(`${key}: ${contract.additional_services[key]} EUR`)
      })
      if (services.length > 0) {
        additionalServicesText = services.join(', ')
      }
    }
    
    // Rental Total berechnen
    const rentalTotal = (contract.daily_rate || 0) * (contract.rental_days || 0)
    
    const replacements = {
      contract_number: contract.contract_number || '',
      signature_date: new Date().toLocaleDateString('de-DE'),
      customer_name: contract.customer_name || '',
      customer_address: contract.customer_address || '',
      customer_phone: contract.customer_phone || '',
      customer_email: contract.customer_email || '',
      customer_id_number: contract.customer_id_number || '',
      customer_drivers_license: contract.customer_drivers_license || '',
      
      // Fahrzeug
      vehicle_manufacturer: contract.vehicle_manufacturer || '[Hersteller]',
      vehicle_model: contract.vehicle_model || '[Modell]',
      vehicle_registration: contract.vehicle_registration || '',
      vehicle_vin: contract.vehicle_vin || '[VIN]',
      rental_start_mileage: contract.rental_start_mileage || '0',
      vehicle_equipment: contract.vehicle_equipment || 'Standardausstattung',
      
      // Zeiten
      rental_start_date: contract.rental_start_date ? new Date(contract.rental_start_date).toLocaleDateString('de-DE') : '',
      rental_end_date: contract.rental_end_date ? new Date(contract.rental_end_date).toLocaleDateString('de-DE') : '',
      rental_start_time: contract.rental_start_time || '10:00',
      rental_end_time: contract.rental_end_time || '10:00',
      rental_days: contract.rental_days || 0,
      
      // Preise
      daily_rate: contract.daily_rate || 0,
      rental_total: rentalTotal,
      total_amount: contract.total_amount || 0,
      service_fee: contract.service_fee || 0,
      deposit_amount: contract.deposit_amount || 0,
      additional_services_text: additionalServicesText,
      
      // Zahlungen
      down_payment: contract.down_payment || 0,
      down_payment_due_date: contract.down_payment_due_date ? new Date(contract.down_payment_due_date).toLocaleDateString('de-DE') : '[Datum]',
      final_payment: contract.final_payment || 0,
      final_payment_due_date: contract.final_payment_due_date ? new Date(contract.final_payment_due_date).toLocaleDateString('de-DE') : '[Datum]',
      
      // Bank
      bank_account_holder: contract.bank_account_holder || 'Andreas Grimm und Ben Neuendorf GbR',
      bank_iban: contract.bank_iban || '[IBAN]',
      bank_bic: contract.bank_bic || '[BIC]',
      bank_name: contract.bank_name || '[Bank]',
      
      // Versicherung
      insurance_package: contract.insurance_package || 'Standard',
      deductible_full_coverage: contract.deductible_full_coverage || 1000,
      deductible_partial_coverage: contract.deductible_partial_coverage || 500,
      
      // Weitere Fahrer & Länder
      additional_drivers_text: additionalDriversText,
      permitted_countries: contract.permitted_countries || 'EU, Schweiz, Norwegen',
      
      // Gebühren
      fee_professional_cleaning: contract.fee_professional_cleaning || 139.00,
      fee_toilet_disposal: contract.fee_toilet_disposal || 200.00,
      fee_late_return_per_hour: contract.fee_late_return_per_hour || 29.00,
      fee_booking_change: contract.fee_booking_change || 21.00,
      fee_smoking_violation: contract.fee_smoking_violation || 300.00,
      fee_refueling: contract.fee_refueling || 35.00,
      
      // Kilometer
      included_km: contract.included_km || 250,
      extra_km_rate: contract.extra_km_rate || 0.35,
      unlimited_km_fee: contract.unlimited_km_fee || 240.00
    }
    
    // Alle Platzhalter ersetzen
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, replacements[key])
    })
    
    // Unterschriften einfügen
    const tenantSignature = signatures.find(s => s.signer_type === 'tenant')
    if (tenantSignature) {
      html = html.replace(
        '{{signature_tenant}}',
        `<img src="${tenantSignature.signature_data}" class="signature-img" alt="Unterschrift Mieter" /><br><p>${tenantSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_tenant}}', '<p style="color: #999;">Nicht unterschrieben</p>')
    }
    
    const landlordSignature = signatures.find(s => s.signer_type === 'landlord')
    if (landlordSignature) {
      html = html.replace(
        '{{signature_landlord}}',
        `<img src="${landlordSignature.signature_data}" class="signature-img" alt="Unterschrift Vermieter" /><br><p>${landlordSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_landlord}}', '<p style="color: #999;">Nicht unterschrieben</p>')
    }
    
    // 5. PDF erstellen
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.width = '210mm'
    document.body.appendChild(tempDiv)
    
    await pdf.html(tempDiv, {
      callback: function(doc) {
        document.body.removeChild(tempDiv)
        doc.save(`Mietvertrag_${contract.contract_number}_${contract.customer_name}.pdf`)
      },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 800,
      html2canvas: {
        scale: 0.265,
        useCORS: true,
        logging: false
      }
    })
    
    return true
  } catch (err) {
    console.error('PDF Generation Error:', err)
    throw err
  }
}