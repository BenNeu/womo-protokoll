import { supabase } from './supabaseClient'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

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
    
    // Unterschriften einfügen
    const tenantSignature = signatures.find(s => s.signer_type === 'tenant')
    if (tenantSignature) {
      html = html.replace(
        '{{signature_tenant}}',
        `<img src="${tenantSignature.signature_data}" style="max-width: 200px; max-height: 80px;" alt="Unterschrift Mieter" /><br><p>${tenantSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_tenant}}', '<p>Nicht unterschrieben</p>')
    }
    
    const landlordSignature = signatures.find(s => s.signer_type === 'landlord')
    if (landlordSignature) {
      html = html.replace(
        '{{signature_landlord}}',
        `<img src="${landlordSignature.signature_data}" style="max-width: 200px; max-height: 80px;" alt="Unterschrift Vermieter" /><br><p>${landlordSignature.signer_name}</p>`
      )
    } else {
      html = html.replace('{{signature_landlord}}', '<p>Nicht unterschrieben</p>')
    }
    
    // 5. HTML in temporäres Element rendern
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.width = '210mm'
    tempDiv.style.padding = '20mm'
    tempDiv.style.fontFamily = 'Arial, sans-serif'
    tempDiv.style.fontSize = '12pt'
    tempDiv.style.lineHeight = '1.6'
    document.body.appendChild(tempDiv)
    
    // 6. Canvas erstellen
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    
    // 7. PDF generieren
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let heightLeft = imgHeight
    let position = 0
    
    // Erste Seite
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297
    
    // Weitere Seiten wenn nötig
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
    }
    
    // 8. PDF herunterladen
    pdf.save(`Mietvertrag_${contract.contract_number}_${contract.customer_name}.pdf`)
    
    // 9. Temporäres Element entfernen
    document.body.removeChild(tempDiv)
    
    return true
  } catch (err) {
    console.error('PDF Generation Error:', err)
    throw err
  }
}