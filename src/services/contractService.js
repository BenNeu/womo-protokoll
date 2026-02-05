import { supabase } from './supabaseClient'

// Templates laden
export const fetchTemplates = async () => {
  const { data, error } = await supabase
    .from('OrcaCampers_contract_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Alle Verträge laden
export const fetchContracts = async () => {
  const { data, error } = await supabase
    .from('OrcaCampers_rental_contracts')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Einzelnen Vertrag laden
export const fetchContract = async (id) => {
  const { data, error } = await supabase
    .from('OrcaCampers_rental_contracts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Neuen Vertrag erstellen
export const createContract = async (contractData) => {
  try {
    // Vertragsnummer generieren
    const contractNumber = `WM-${Date.now()}`
    
    console.log('Versuche Vertrag zu erstellen:', { ...contractData, contract_number: contractNumber })
    
    const { data, error } = await supabase
      .from('OrcaCampers_rental_contracts')
      .insert([{
        ...contractData,
        contract_number: contractNumber,
        status: 'draft'
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Supabase Error:', error)
      throw error
    }
    
    console.log('Vertrag erstellt:', data)
    return data
  } catch (err) {
    console.error('Create Contract Error:', err)
    throw err
  }
}

// Vertrag aktualisieren
export const updateContract = async (id, updates) => {
  try {
    // Entferne created_by und andere read-only Felder
    const { created_by, created_at, id: contractId, ...cleanUpdates } = updates
    
    console.log('Update Contract:', id, cleanUpdates)
    
    const { data, error } = await supabase
      .from('OrcaCampers_rental_contracts')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Supabase Update Error:', error)
      throw error
    }
    
    console.log('Vertrag aktualisiert:', data)
    return data
  } catch (err) {
    console.error('Update Contract Error:', err)
    throw err
  }
}

// Unterschrift speichern
export const saveSignature = async (contractId, signerType, signerName, signatureData) => {
  const { data, error } = await supabase
    .from('OrcaCampers_contract_signatures')
    .insert([{
      contract_id: contractId,
      signer_type: signerType,
      signer_name: signerName,
      signature_data: signatureData
    }])
    .select()
    .single()
  
  if (error) throw error
  
  // Status aktualisieren wenn beide unterschrieben haben
  const { data: signatures } = await supabase
    .from('OrcaCampers_contract_signatures')
    .select('*')
    .eq('contract_id', contractId)
  
  if (signatures && signatures.length === 2) {
    await updateContract(contractId, { status: 'signed' })
  }
  
  return data
} // ← Dieses } hat gefehlt!

// PDF Export für Mietvertrag
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
    
    // Basis-Daten ersetzen
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
    
    // Alle Platzhalter ersetzen
    Object.keys(replacements).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      html = html.replace(regex, replacements[key])
    })
    
    // Unterschrift des Mieters einfügen
    const tenantSignature = signatures.find(s => s.signer_type === 'tenant')
    if (tenantSignature) {
      html = html.replace(
        '{{signature_tenant}}',
        `<img src="${tenantSignature.signature_data}" class="signature-img" alt="Unterschrift Mieter" /><br><p>${tenantSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_tenant}}', '<p>Nicht unterschrieben</p>')
    }
    
    // Unterschrift des Vermieters einfügen
    const landlordSignature = signatures.find(s => s.signer_type === 'landlord')
    if (landlordSignature) {
      html = html.replace(
        '{{signature_landlord}}',
        `<img src="${landlordSignature.signature_data}" class="signature-img" alt="Unterschrift Vermieter" /><br><p>${landlordSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_landlord}}', '<p>Nicht unterschrieben</p>')
    }
    
    // 5. HTML zurückgeben (wird dann im Frontend zu PDF konvertiert)
    return html
    
  } catch (error) {
    console.error('Fehler beim PDF-Export:', error)
    throw error
  }
}