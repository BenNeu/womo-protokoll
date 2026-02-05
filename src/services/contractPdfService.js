import { supabase } from './supabaseClient'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const generateContractPDF = async (contractId) => {
  try {
    // 1. Vertrag laden
    const { data: contract, error: contractError } = await supabase
      .from('OrcaCampers_rental_contracts')
      .select('*')
      .eq('id', contractId)
      .single()
    
    if (contractError) throw contractError
    
    // 2. Unterschriften laden
    const { data: signatures, error: sigError } = await supabase
      .from('OrcaCampers_contract_signatures')
      .select('*')
      .eq('contract_id', contractId)
    
    if (sigError) throw sigError
    
    // 3. PDF erstellen
    const pdf = new jsPDF('p', 'mm', 'a4')
    let yPos = 20
    const margin = 20
    const pageWidth = 210
    const contentWidth = pageWidth - (2 * margin)
    
    // Header
    pdf.setFontSize(20)
    pdf.setFont(undefined, 'bold')
    pdf.text('Wohnmobil-Mietvertrag', pageWidth / 2, yPos, { align: 'center' })
    yPos += 10
    
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    pdf.text(`Vertragsnummer: ${contract.contract_number}`, pageWidth / 2, yPos, { align: 'center' })
    yPos += 15
    
    // § 1 Vertragsparteien
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('§ 1 Vertragsparteien', margin, yPos)
    yPos += 8
    
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'bold')
    pdf.text('Vermieter:', margin, yPos)
    yPos += 6
    
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    pdf.text('OrcaCampers', margin, yPos)
    yPos += 5
    pdf.text('[Deine Adresse]', margin, yPos)
    yPos += 5
    pdf.text('[Deine Stadt]', margin, yPos)
    yPos += 10
    
    pdf.setFontSize(11)
    pdf.setFont(undefined, 'bold')
    pdf.text('Mieter:', margin, yPos)
    yPos += 6
    
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    pdf.text(contract.customer_name || '', margin, yPos)
    yPos += 5
    if (contract.customer_address) {
      pdf.text(contract.customer_address, margin, yPos)
      yPos += 5
    }
    pdf.text(`Email: ${contract.customer_email || ''}`, margin, yPos)
    yPos += 5
    pdf.text(`Telefon: ${contract.customer_phone || ''}`, margin, yPos)
    yPos += 5
    pdf.text(`Ausweis-Nr.: ${contract.customer_id_number || ''}`, margin, yPos)
    yPos += 5
    pdf.text(`Führerschein-Nr.: ${contract.customer_drivers_license || ''}`, margin, yPos)
    yPos += 12
    
    // § 2 Mietgegenstand
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('§ 2 Mietgegenstand', margin, yPos)
    yPos += 8
    
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    pdf.text(`Fahrzeug: ${contract.vehicle_registration || ''}`, margin, yPos)
    yPos += 5
    pdf.text(`Mietbeginn: ${new Date(contract.rental_start_date).toLocaleDateString('de-DE')}`, margin, yPos)
    yPos += 5
    pdf.text(`Mietende: ${new Date(contract.rental_end_date).toLocaleDateString('de-DE')}`, margin, yPos)
    yPos += 5
    pdf.text(`Mietdauer: ${contract.rental_days} Tage`, margin, yPos)
    yPos += 12
    
    // § 3 Mietpreis und Kaution
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('§ 3 Mietpreis und Kaution', margin, yPos)
    yPos += 8
    
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    pdf.text(`Tagessatz: ${contract.daily_rate} EUR`, margin, yPos)
    yPos += 5
    pdf.text(`Gesamtbetrag: ${contract.total_amount} EUR`, margin, yPos)
    yPos += 5
    pdf.text(`Kaution: ${contract.deposit_amount} EUR`, margin, yPos)
    yPos += 5
    pdf.text(`Inklusive Kilometer: ${contract.included_km} km`, margin, yPos)
    yPos += 5
    pdf.text(`Mehrkilometer: ${contract.extra_km_rate} EUR/km`, margin, yPos)
    yPos += 12
    
    // § 4 Versicherung (wenn vorhanden)
    if (contract.insurance_package) {
      pdf.setFontSize(14)
      pdf.setFont(undefined, 'bold')
      pdf.text('§ 4 Versicherung', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Versicherungspaket: ${contract.insurance_package}`, margin, yPos)
      yPos += 12
    }
    
    // § 5 Besondere Vereinbarungen (wenn vorhanden)
    if (contract.special_terms) {
      // Neue Seite wenn nicht genug Platz
      if (yPos > 240) {
        pdf.addPage()
        yPos = 20
      }
      
      pdf.setFontSize(14)
      pdf.setFont(undefined, 'bold')
      pdf.text('§ 5 Besondere Vereinbarungen', margin, yPos)
      yPos += 8
      
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      const lines = pdf.splitTextToSize(contract.special_terms, contentWidth)
      pdf.text(lines, margin, yPos)
      yPos += (lines.length * 5) + 12
    }
    
    // Unterschriften - immer auf neuer Seite wenn wenig Platz
    if (yPos > 200) {
      pdf.addPage()
      yPos = 20
    }
    
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    pdf.text('Unterschriften', margin, yPos)
    yPos += 15
    
    // Unterschrift Vermieter
    const landlordSignature = signatures.find(s => s.signer_type === 'landlord')
    if (landlordSignature) {
      pdf.addImage(landlordSignature.signature_data, 'PNG', margin, yPos, 60, 20)
    }
    pdf.line(margin, yPos + 22, margin + 60, yPos + 22)
    pdf.setFontSize(9)
    pdf.text('Vermieter', margin, yPos + 27)
    if (landlordSignature) {
      pdf.text(landlordSignature.signer_name, margin, yPos + 32)
    }
    
    // Unterschrift Mieter
    const tenantSignature = signatures.find(s => s.signer_type === 'tenant')
    const sigXPos = margin + 70
    if (tenantSignature) {
      pdf.addImage(tenantSignature.signature_data, 'PNG', sigXPos, yPos, 60, 20)
    }
    pdf.line(sigXPos, yPos + 22, sigXPos + 60, yPos + 22)
    pdf.text('Mieter', sigXPos, yPos + 27)
    if (tenantSignature) {
      pdf.text(tenantSignature.signer_name, sigXPos, yPos + 32)
    }
    
    // Footer
    pdf.setFontSize(8)
    pdf.setTextColor(150)
    pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, pageWidth / 2, 285, { align: 'center' })
    
    // PDF herunterladen
    pdf.save(`Mietvertrag_${contract.contract_number}_${contract.customer_name}.pdf`)
    
    return true
  } catch (err) {
    console.error('PDF Generation Error:', err)
    throw err
  }
}