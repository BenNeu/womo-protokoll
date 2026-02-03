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
    .select('*')  // Erstmal nur den Vertrag ohne Signaturen
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
}