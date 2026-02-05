import { supabase } from './supabaseClient'

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
    
    const replacements = {
      contract_number: contract.contract_number || '',
      signature_date: new Date().toLocaleDateString('de-DE'),
      customer_name: contract.customer_name || '',
      customer_address: contract.customer_address || '',
      customer_phone: contract.customer_phone || '',
      customer_email: contract.customer_email || '',
      customer_id_number: contract.customer_id_number || '',
      customer_drivers_license: contract.customer_drivers_license || '',
      vehicle_manufacturer: 'Hersteller',
      vehicle_model: 'Modell',
      vehicle_registration: contract.vehicle_registration || '',
      rental_start_date: contract.rental_start_date ? new Date(contract.rental_start_date).toLocaleDateString('de-DE') : '',
      rental_end_date: contract.rental_end_date ? new Date(contract.rental_end_date).toLocaleDateString('de-DE') : '',
      rental_days: contract.rental_days || 0,
      daily_rate: contract.daily_rate || 0,
      total_amount: contract.total_amount || 0,
      deposit_amount: contract.deposit_amount || 0,
      insurance_package: contract.insurance_package || 'Standard',
      included_km: contract.included_km || 0,
      extra_km_rate: contract.extra_km_rate || 0
    }
    
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, replacements[key])
    })
    
    // Unterschrift einfügen
    const tenantSignature = signatures.find(s => s.signer_type === 'tenant')
    if (tenantSignature) {
      html = html.replace(
        '{{signature_tenant}}',
        `<img src="${tenantSignature.signature_data}" class="signature-img" alt="Unterschrift Mieter" /><br><p>${tenantSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_tenant}}', '<p>Nicht unterschrieben</p>')
    }
    
    // 5. PDF erstellen
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
    
    await doc.html(html, {
      callback: function(doc) {
        doc.save(`Mietvertrag_${contract.contract_number}_${contract.customer_name}.pdf`)
      },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 800
    })
    
    return true
  } catch (err) {
    console.error('PDF Generation Error:', err)
    throw err
  }
}