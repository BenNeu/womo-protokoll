import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const generateProtocolPDF = async (protocol, rental) => {
  // PDF erstellen
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 20

  // Header - Logo könnte hier eingefügt werden
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('OrcaCampers', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  pdf.setFontSize(16)
  pdf.text(
    protocol.protocol_type === 'handover' ? 'Übergabeprotokoll' : 'Rückgabeprotokoll',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 15

  // Mietvorgang Info
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Mietvorgang:', 20, yPos)
  yPos += 7
  
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Vertragsnummer: ${rental.rental_number}`, 20, yPos)
  yPos += 5
  pdf.text(`Kunde: ${rental.customer_name}`, 20, yPos)
  yPos += 5
  pdf.text(
    `Fahrzeug: ${rental.vehicle_manufacturer} ${rental.vehicle_model} (${rental.vehicle_license_plate})`,
    20,
    yPos
  )
  yPos += 5
  pdf.text(
    `Zeitraum: ${new Date(rental.start_date).toLocaleDateString('de-DE')} - ${new Date(rental.end_date).toLocaleDateString('de-DE')}`,
    20,
    yPos
  )
  yPos += 10

  // Protokoll-Details
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Protokoll-Details:', 20, yPos)
  yPos += 7

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(10)
  pdf.text(`Datum: ${new Date(protocol.created_at).toLocaleDateString('de-DE')}`, 20, yPos)
  yPos += 5
  pdf.text(`Durchgeführt von: ${protocol.completed_by}`, 20, yPos)
  yPos += 5
  pdf.text(`Kilometerstand: ${protocol.mileage} km`, 20, yPos)
  yPos += 5
  pdf.text(`Tankstand: ${getFuelLevelText(protocol.fuel_level)}`, 20, yPos)
  yPos += 5
  pdf.text(`Frischwasser: ${getWaterLevelText(protocol.fresh_water_tank)}`, 20, yPos)
  yPos += 5
  pdf.text(`Abwasser: ${getWaterLevelText(protocol.waste_water_tank)}`, 20, yPos)
  yPos += 10

  // Äußerer Zustand
  if (yPos > pageHeight - 60) {
    pdf.addPage()
    yPos = 20
  }

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Äußerer Zustand:', 20, yPos)
  yPos += 7

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  
  Object.entries(protocol.exterior_condition || {}).forEach(([key, value]) => {
    if (yPos > pageHeight - 20) {
      pdf.addPage()
      yPos = 20
    }
    const label = getConditionLabel(key)
    const status = getStatusText(value.status)
    pdf.text(`${label}: ${status}`, 25, yPos)
    if (value.notes) {
      yPos += 4
      pdf.setFont('helvetica', 'italic')
      pdf.text(`  Anmerkung: ${value.notes}`, 25, yPos)
      pdf.setFont('helvetica', 'normal')
    }
    yPos += 5
  })
  yPos += 5

  // Innenausstattung
  if (yPos > pageHeight - 60) {
    pdf.addPage()
    yPos = 20
  }

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Innenausstattung:', 20, yPos)
  yPos += 7

  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)

  Object.entries(protocol.interior_condition || {}).forEach(([key, value]) => {
    if (yPos > pageHeight - 20) {
      pdf.addPage()
      yPos = 20
    }
    const label = getConditionLabel(key)
    const status = getStatusText(value.status)
    pdf.text(`${label}: ${status}`, 25, yPos)
    if (value.notes) {
      yPos += 4
      pdf.setFont('helvetica', 'italic')
      pdf.text(`  Anmerkung: ${value.notes}`, 25, yPos)
      pdf.setFont('helvetica', 'normal')
    }
    yPos += 5
  })
  yPos += 5

  // Schäden/Anmerkungen
  if (protocol.damage_notes) {
    if (yPos > pageHeight - 40) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Schäden/Anmerkungen:', 20, yPos)
    yPos += 7

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const splitNotes = pdf.splitTextToSize(protocol.damage_notes, pageWidth - 40)
    pdf.text(splitNotes, 20, yPos)
    yPos += splitNotes.length * 5 + 5
  }

  // Zusätzliche Notizen
  if (protocol.additional_notes) {
    if (yPos > pageHeight - 40) {
      pdf.addPage()
      yPos = 20
    }

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Zusätzliche Notizen:', 20, yPos)
    yPos += 7

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    const splitNotes = pdf.splitTextToSize(protocol.additional_notes, pageWidth - 40)
    pdf.text(splitNotes, 20, yPos)
    yPos += splitNotes.length * 5 + 10
  }

  // Unterschriften
  if (yPos > pageHeight - 80) {
    pdf.addPage()
    yPos = 20
  }

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Unterschriften:', 20, yPos)
  yPos += 10

  // Mieter Unterschrift
  if (protocol.customer_signature) {
    try {
      pdf.addImage(protocol.customer_signature, 'PNG', 20, yPos, 80, 30)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Unterschrift Mieter', 20, yPos + 35)
    } catch (err) {
      console.error('Fehler beim Einfügen der Unterschrift:', err)
    }
  }

  // Mitarbeiter Unterschrift
  if (protocol.staff_signature) {
    try {
      pdf.addImage(protocol.staff_signature, 'PNG', 110, yPos, 80, 30)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.text('Unterschrift Mitarbeiter', 110, yPos + 35)
    } catch (err) {
      console.error('Fehler beim Einfügen der Unterschrift:', err)
    }
  }

  // Footer
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  pdf.text(
    `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  )

  // PDF speichern
  const filename = `Protokoll_${rental.rental_number}_${protocol.protocol_type}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}

// Hilfsfunktionen
function getFuelLevelText(level) {
  const levels = {
    full: 'Voll',
    '3/4': '3/4',
    '1/2': '1/2',
    '1/4': '1/4',
    empty: 'Leer'
  }
  return levels[level] || level
}

function getWaterLevelText(level) {
  const levels = {
    full: 'Voll',
    partial: 'Teilweise',
    empty: 'Leer'
  }
  return levels[level] || level
}

function getStatusText(status) {
  const statuses = {
    good: 'Gut',
    fair: 'Befriedigend',
    damaged: 'Mangelhaft',
    working: 'Funktioniert',
    defect: 'Defekt'
  }
  return statuses[status] || status
}

function getConditionLabel(key) {
  const labels = {
    paint_body: 'Lack/Karosserie',
    windows_glass: 'Fenster/Scheiben',
    tires: 'Reifen',
    lighting: 'Beleuchtung',
    roof_skylight: 'Dach/Dachluke',
    doors_locks: 'Türen/Schlösser',
    awning: 'Markise',
    trailer_hitch: 'Anhängerkupplung',
    upholstery_seats: 'Polster/Sitze',
    carpet_flooring: 'Teppich/Bodenbelag',
    walls_panels: 'Wände/Verkleidung',
    windows_blinds: 'Fenster/Rollos',
    kitchen_stove: 'Küche/Kocher',
    refrigerator: 'Kühlschrank',
    heating: 'Heizung',
    toilet_shower: 'Toilette/Dusche',
    sink_faucet: 'Waschbecken/Wasserhahn',
    interior_lighting: 'Beleuchtung (innen)',
    gas_system: 'Gasanlage',
    battery_power: 'Batterie/Stromversorgung'
  }
  return labels[key] || key
}