/* eslint-disable no-unused-vars */
import jsPDF from 'jspdf'

// Hilfsfunktion: Bild von URL laden via Proxy + KOMPRIMIEREN
const loadImageAsBase64 = async (url) => {
  try {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(String(url))}`
    const response = await fetch(proxyUrl)
    if (!response.ok) throw new Error(`Status ${response.status}`)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(blob)
      img.onload = () => {
        const maxWidth = 800
        const scale = Math.min(1, maxWidth / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(objectUrl)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
      img.src = objectUrl
    })
  } catch (e) {
    console.log('Bild konnte nicht geladen werden:', url, e.message)
    return null
  }
}

// Hilfsfunktion: Unterschrift mit weißem Hintergrund (Fix für schwarze PNGs)
const prepareSignature = async (dataUrl) => {
  if (!dataUrl) return null
  
  if (dataUrl.startsWith('http')) {
    return await loadImageAsBase64(dataUrl)
  }
  
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width || 400
      canvas.height = img.height || 150
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

// Hilfsfunktion: Supabase Array-Felder parsen
const parseArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'string') return JSON.parse(parsed)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch (e) {
    return []
  }
}

// Hilfsfunktion: JSON-Objekte parsen
const parseJsonField = (value) => {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return null
  } catch (e) {
    console.log('JSON-Feld konnte nicht geparst werden:', e.message)
    return null
  }
}

// Hilfsfunktion: neue Seite wenn nötig
const checkPageBreak = (pdf, yPos, needed = 30) => {
  if (yPos + needed > 270) {
    pdf.addPage()
    return 20
  }
  return yPos
}

// Hilfsfunktion: Status-Label
const getStatusLabel = (status) => {
  const map = {
    good: 'Gut', fair: 'Befriedigend', damaged: 'Mangelhaft',
    working: 'Funktioniert', defect: 'Defekt'
  }
  return map[status] || status || '-'
}

// ─────────────────────────────────────────────────────────────────
// 1. ÜBERGABE/RÜCKNAHME PROTOKOLL – Download
// ─────────────────────────────────────────────────────────────────
export const generateProtocolPDF = async (protocol, rental) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')

    const idPhotos = parseArray(protocol.id_card_photos)
    const licensePhotos = parseArray(protocol.drivers_license_photo)
    const photoUrls = parseArray(protocol.photo_urls)
    const exterior = parseJsonField(protocol.exterior_condition)
    const interior = parseJsonField(protocol.interior_condition)
    const equipment = parseJsonField(protocol.equipment_checklist)

    let yPos = 20

    // HEADER
    const logoImg = new Image()
    logoImg.src = '/logo.png'
    await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve })
    try { pdf.addImage(logoImg, 'PNG', 15, yPos, 30, 30) } catch (e) {}

    const protocolType = protocol.protocol_type === 'handover' ? 'Übergabe' : 'Rücknahme'
    pdf.setFontSize(20); pdf.setFont('helvetica', 'bold')
    pdf.text(`${protocolType}protokoll`, 105, yPos + 10, { align: 'center' })
    pdf.setFontSize(11); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100)
    const protocolDate = new Date(protocol.created_at)
    pdf.text(`Erstellt am ${protocolDate.toLocaleDateString('de-DE')} um ${protocolDate.toLocaleTimeString('de-DE')}`, 105, yPos + 18, { align: 'center' })
    pdf.setTextColor(0); yPos += 40

    // STAMMDATEN
    pdf.setFillColor(240, 249, 245)
    pdf.roundedRect(15, yPos, 180, 38, 3, 3, 'F')
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Mietvorgang', 20, yPos + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Vertragsnummer: ${rental.rental_number}`, 20, yPos + 16)
    pdf.text(`Kunde: ${rental.customer_name}`, 20, yPos + 23)
    pdf.text(`Fahrzeug: ${rental.vehicle_manufacturer} ${rental.vehicle_model}`, 110, yPos + 16)
    pdf.text(`Kennzeichen: ${rental.vehicle_license_plate || '-'}`, 110, yPos + 23)
    pdf.text(`Durchgeführt von: ${protocol.completed_by}`, 20, yPos + 30)
    yPos += 48

    // FAHRZEUGDATEN
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Fahrzeugdaten', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
    pdf.text(`Kilometerstand: ${protocol.mileage} km`, 15, yPos)
    pdf.text(`Tankstand: ${protocol.fuel_level}`, 80, yPos); yPos += 6
    pdf.text(`Frischwasser: ${protocol.fresh_water_tank}`, 15, yPos)
    pdf.text(`Abwasser: ${protocol.waste_water_tank}`, 80, yPos); yPos += 12

    // ÄUSSERER ZUSTAND
    yPos = checkPageBreak(pdf, yPos, 50)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Äußerer Zustand', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    if (exterior) {
      const exteriorLabels = {
        paint_body: 'Lack/Karosserie', windows_glass: 'Fenster/Scheiben',
        tires: 'Reifen', lighting: 'Beleuchtung', roof_skylight: 'Dach/Dachluke',
        doors_locks: 'Türen/Schlösser', awning: 'Markise', trailer_hitch: 'Anhängerkupplung'
      }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(exteriorLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const status = exterior[key]?.status || (exterior[key]?.present !== undefined ? (exterior[key].present ? 'Vorhanden' : 'Nicht vorhanden') : '-')
        pdf.text(`${exteriorLabels[key]}: ${getStatusLabel(status)}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
    } else {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150)
      pdf.text('Keine Daten vorhanden', 15, yPos); pdf.setTextColor(0); yPos += 6
    }
    yPos += 8

    // INNENAUSSTATTUNG
    yPos = checkPageBreak(pdf, yPos, 50)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Innenausstattung', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    if (interior) {
      const interiorLabels = {
        upholstery_seats: 'Polster/Sitze', carpet_flooring: 'Teppich/Boden',
        walls_panels: 'Wände/Verkleidung', windows_blinds: 'Fenster/Rollos',
        kitchen_stove: 'Küche/Kocher', refrigerator: 'Kühlschrank',
        heating: 'Heizung', toilet_shower: 'Toilette/Dusche',
        sink_faucet: 'Waschbecken', interior_lighting: 'Beleuchtung innen',
        gas_system: 'Gasanlage', battery_power: 'Batterie/Strom'
      }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(interiorLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const status = interior[key]?.status || '-'
        pdf.text(`${interiorLabels[key]}: ${getStatusLabel(status)}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
    } else {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150)
      pdf.text('Keine Daten vorhanden', 15, yPos); pdf.setTextColor(0); yPos += 6
    }
    yPos += 8

    // AUSRÜSTUNG
    yPos = checkPageBreak(pdf, yPos, 40)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Ausrüstung & Inventar', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    if (equipment) {
      const eqLabels = {
        spare_tire: 'Ersatzrad', jack: 'Wagenheber', tool_kit: 'Werkzeugset',
        first_aid_kit: 'Verbandskasten', warning_triangle: 'Warndreieck',
        safety_vests: 'Warnwesten', fire_extinguisher: 'Feuerlöscher',
        dishes_cutlery: 'Geschirr/Besteck', bedding: 'Bettwäsche',
        towels: 'Handtücher', camping_furniture: 'Campingmöbel',
        logbook: 'Fahrtenbuch', document_folder: 'Dokumentenmappe'
      }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(eqLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const present = equipment[key]?.present !== undefined ? (equipment[key].present ? '[X]' : '[ ]') : '[X]'
        pdf.text(`${present} ${eqLabels[key]}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
      yPos += 4
      pdf.text(`Schlüssel: ${equipment.keys_count || '-'} Stück`, 15, yPos)
    } else {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150)
      pdf.text('Keine Daten vorhanden', 15, yPos); pdf.setTextColor(0); yPos += 6
    }
    yPos += 12

    // SCHÄDEN & NOTIZEN
    if (protocol.damage_notes) {
      yPos = checkPageBreak(pdf, yPos, 20)
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text('Schäden / Anmerkungen', 15, yPos)
      yPos += 7; pdf.setDrawColor(220, 38, 38); pdf.line(15, yPos, 195, yPos); yPos += 6
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(protocol.damage_notes, 180)
      pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 8
    }
    if (protocol.additional_notes) {
      yPos = checkPageBreak(pdf, yPos, 20)
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
      pdf.text('Zusätzliche Notizen', 15, yPos); yPos += 6
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
      const lines = pdf.splitTextToSize(protocol.additional_notes, 180)
      pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 8
    }

    // FAHRZEUGFOTOS
    if (photoUrls.length > 0) {
      pdf.addPage(); yPos = 20
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text(`Fahrzeugfotos (${photoUrls.length})`, 15, yPos)
      yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 10
      let col = 0
      const photoW = 85, photoH = 60
      for (const url of photoUrls) {
        yPos = checkPageBreak(pdf, yPos, photoH + 15)
        const xPos = col === 0 ? 15 : 105
        const imgData = await loadImageAsBase64(url)
        if (imgData) {
          try { pdf.addImage(imgData, 'JPEG', xPos, yPos, photoW, photoH) } catch (e) {
            pdf.setFontSize(8); pdf.setTextColor(150); pdf.text('[Foto nicht verfügbar]', xPos + 5, yPos + 30); pdf.setTextColor(0)
          }
        } else {
          pdf.setFontSize(8); pdf.setTextColor(150); pdf.text('[Foto nicht verfügbar]', xPos + 5, yPos + 30); pdf.setTextColor(0)
        }
        if (col === 1) yPos += photoH + 10
        col = col === 0 ? 1 : 0
      }
      if (col === 1) yPos += photoH + 10
    }

    // AUSWEISDOKUMENTE
    if (idPhotos.length > 0 || licensePhotos.length > 0) {
      pdf.addPage(); yPos = 20
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text('Ausweisdokumente', 15, yPos)
      yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 10
      if (idPhotos.length > 0) {
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
        pdf.text('Personalausweis:', 15, yPos); yPos += 8
        let col = 0
        for (const url of idPhotos) {
          const xPos = col === 0 ? 15 : 105
          const imgData = await loadImageAsBase64(url)
          if (imgData) { try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 55) } catch (e) {} }
          if (col === 1) yPos += 65
          col = col === 0 ? 1 : 0
        }
        if (col === 1) yPos += 65
        yPos += 8
      }
      if (licensePhotos.length > 0) {
        yPos = checkPageBreak(pdf, yPos, 70)
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
        pdf.text('Führerschein:', 15, yPos); yPos += 8
        let col = 0
        for (const url of licensePhotos) {
          const xPos = col === 0 ? 15 : 105
          const imgData = await loadImageAsBase64(url)
          if (imgData) { try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 55) } catch (e) {} }
          if (col === 1) yPos += 65
          col = col === 0 ? 1 : 0
        }
        if (col === 1) yPos += 65
      }
    }

    // UNTERSCHRIFTEN
    pdf.addPage(); yPos = 20
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschriften', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 15

    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mieter:', 15, yPos); yPos += 8
    if (protocol.customer_signature) {
      const sigData = await prepareSignature(protocol.customer_signature)
      if (sigData) { try { pdf.addImage(sigData, 'JPEG', 15, yPos, 85, 35) } catch (e) {} }
    }
    pdf.setDrawColor(100); pdf.line(15, yPos + 38, 100, yPos + 38)
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
    pdf.text(`${rental.customer_name}`, 15, yPos + 44)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')}`, 15, yPos + 50)

    yPos -= 8
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mitarbeiter:', 110, yPos); yPos += 8
    if (protocol.staff_signature) {
      const sigData = await prepareSignature(protocol.staff_signature)
      if (sigData) { try { pdf.addImage(sigData, 'JPEG', 110, yPos, 85, 35) } catch (e) {} }
    }
    pdf.setDrawColor(100); pdf.line(110, yPos + 38, 195, yPos + 38)
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
    pdf.text(`${protocol.completed_by}`, 110, yPos + 44)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')}`, 110, yPos + 50)

    const fileName = `${protocolType}_${rental.rental_number}_${protocolDate.toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

  } catch (error) {
    console.error('Fehler beim PDF-Export:', error)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. AUFBEREITUNGS-PROTOKOLL – Download
// ─────────────────────────────────────────────────────────────────
export const generateCleaningProtocolPDF = async (protocol, rental) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    let yPos = 20

    const logoImg = new Image()
    logoImg.src = '/logo.png'
    await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve })
    try { pdf.addImage(logoImg, 'PNG', 15, yPos, 30, 30) } catch (e) {}

    pdf.setFontSize(20); pdf.setFont('helvetica', 'bold')
    pdf.text('Fahrzeug-Aufbereitungs-Protokoll', 105, yPos + 10, { align: 'center' })
    pdf.setFontSize(11); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100)
    const cleaningDate = new Date(protocol.cleaning_date)
    pdf.text(`Erstellt am ${cleaningDate.toLocaleDateString('de-DE')} um ${cleaningDate.toLocaleTimeString('de-DE')}`, 105, yPos + 18, { align: 'center' })
    pdf.setTextColor(0); yPos += 40

    pdf.setFillColor(240, 249, 245)
    pdf.roundedRect(15, yPos, 180, 32, 3, 3, 'F')
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Mietvorgang', 20, yPos + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Vertragsnummer: ${rental.rental_number}`, 20, yPos + 16)
    pdf.text(`Kunde: ${rental.customer_name}`, 20, yPos + 23)
    pdf.text(`Fahrzeug: ${rental.vehicle_manufacturer} ${rental.vehicle_model}`, 110, yPos + 16)
    pdf.text(`Kennzeichen: ${rental.vehicle_license_plate || '-'}`, 110, yPos + 23)
    yPos += 42
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text(`Mitarbeiter: ${protocol.employee_name}`, 15, yPos); yPos += 12

    const renderSection = (title, items) => {
      yPos = checkPageBreak(pdf, yPos, 40)
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text(title, 15, yPos); yPos += 7
      pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      items.forEach(item => {
        yPos = checkPageBreak(pdf, yPos, 8)
        pdf.text(`${item.value ? '[X]' : '[ ]'} ${item.label}`, 20, yPos); yPos += 6
      })
      yPos += 5
    }

    renderSection('1. Außen & Technik', [
      { label: 'Außenwäsche', value: protocol.exterior_wash },
      { label: 'Sichtprüfung Karosserie', value: protocol.exterior_inspection },
      { label: 'Reifen prüfen', value: protocol.tire_check },
      { label: 'Scheiben & Spiegel', value: protocol.windows_mirrors },
      { label: 'Markise reinigen', value: protocol.awning_clean },
      { label: 'Dach / Solarpanels', value: protocol.roof_check },
      { label: 'Unterboden', value: protocol.underbody_check },
    ])
    renderSection('2. Innenraum - Reinigung', [
      { label: 'Komplett saugen', value: protocol.vacuum_interior },
      { label: 'Boden wischen', value: protocol.mop_floor },
      { label: 'Küche reinigen', value: protocol.kitchen_clean },
      { label: 'Kühlschrank', value: protocol.fridge_clean },
      { label: 'Bad & WC', value: protocol.bathroom_clean },
      { label: 'WC-Kassette leeren', value: protocol.toilet_empty },
      { label: 'Mülleimer leeren', value: protocol.trash_empty },
      { label: 'Fenster innen', value: protocol.windows_inside },
      { label: 'Geruchskontrolle', value: protocol.odor_check },
    ])
    renderSection('3. Wasser, Gas & Strom', [
      { label: 'Frischwassertank befüllen', value: protocol.freshwater_fill },
      { label: 'Abwassertank leeren', value: protocol.wastewater_empty },
      { label: 'WC-Zusatz auffüllen', value: protocol.toilet_additive },
      { label: 'Gasflaschen prüfen', value: protocol.gas_check },
      { label: 'Stromanschluss prüfen', value: protocol.power_check },
      { label: 'Batterie prüfen', value: protocol.battery_check },
    ])
    renderSection('4. Ausstattung & Inventar', [
      { label: 'Geschirr & Besteck vollständig', value: protocol.dishes_complete },
      { label: 'Töpfe & Pfannen vollständig', value: protocol.cookware_complete },
      { label: 'Campingmöbel vorhanden', value: protocol.camping_furniture },
      { label: 'Auffahrkeile vorhanden', value: protocol.ramps },
      { label: 'Stromkabel vorhanden', value: protocol.power_cable },
      { label: 'Wasserschlauch vorhanden', value: protocol.water_hose },
      { label: 'Warnweste & Verbandskasten', value: protocol.safety_equipment },
      { label: 'Bedienungsanleitungen vorhanden', value: protocol.manuals_present },
    ])
    renderSection('5. Abschlusskontrolle', [
      { label: 'Schlüssel vollständig', value: protocol.keys_complete },
      { label: 'Dokumentenmappe vollständig', value: protocol.documents_complete },
      { label: 'Fahrzeug fahrbereit', value: protocol.vehicle_ready },
      { label: 'Fotos gemacht', value: protocol.photos_taken },
    ])

    if (protocol.notes) {
      yPos = checkPageBreak(pdf, yPos, 25)
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text('Notizen / Anmerkungen', 15, yPos); yPos += 7
      pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(protocol.notes, 180)
      pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 8
    }

    const photoUrls = parseArray(protocol.photo_urls)
    if (photoUrls.length > 0) {
      pdf.addPage(); yPos = 20
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text(`Fotos (${photoUrls.length})`, 15, yPos)
      yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 10
      let col = 0
      for (const url of photoUrls) {
        yPos = checkPageBreak(pdf, yPos, 75)
        const xPos = col === 0 ? 15 : 105
        const imgData = await loadImageAsBase64(url)
        if (imgData) { try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 60) } catch (e) {} }
        if (col === 1) yPos += 70
        col = col === 0 ? 1 : 0
      }
      if (col === 1) yPos += 70
    }

    // UNTERSCHRIFT
    yPos = checkPageBreak(pdf, yPos, 70)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mitarbeiter', 15, yPos); yPos += 7
    pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 15
    if (protocol.employee_signature) {
      const sigData = await prepareSignature(protocol.employee_signature)
      if (sigData) { try { pdf.addImage(sigData, 'JPEG', 15, yPos, 80, 30) } catch (e) {} }
      yPos += 35
    }
    pdf.setDrawColor(100); pdf.line(15, yPos, 100, yPos); yPos += 5
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
    pdf.text(`${protocol.employee_name}`, 15, yPos); yPos += 5
    pdf.text(`Datum: ${cleaningDate.toLocaleDateString('de-DE')}`, 15, yPos)

    const fileName = `Aufbereitung_${rental.rental_number}_${cleaningDate.toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

  } catch (error) {
    console.error('Fehler beim Cleaning PDF-Export:', error)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────────
// 3. ÜBERGABE/RÜCKNAHME PROTOKOLL – Base64 (für n8n/Email)
// ─────────────────────────────────────────────────────────────────
export const generateProtocolPDFBase64 = async (protocol, rental) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')

    const idPhotos = parseArray(protocol.id_card_photos)
    const licensePhotos = parseArray(protocol.drivers_license_photo)
    const photoUrls = parseArray(protocol.photo_urls)
    const exterior = parseJsonField(protocol.exterior_condition)
    const interior = parseJsonField(protocol.interior_condition)
    const equipment = parseJsonField(protocol.equipment_checklist)

    let yPos = 20

    // HEADER
    const logoImg = new Image()
    logoImg.src = '/logo.png'
    await new Promise((resolve) => { logoImg.onload = resolve; logoImg.onerror = resolve })
    try { pdf.addImage(logoImg, 'PNG', 15, yPos, 30, 30) } catch (e) {}

    const protocolType = protocol.protocol_type === 'handover' ? 'Übergabe' : 'Rücknahme'
    pdf.setFontSize(20); pdf.setFont('helvetica', 'bold')
    pdf.text(`${protocolType}protokoll`, 105, yPos + 10, { align: 'center' })
    pdf.setFontSize(11); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(100)
    const protocolDate = new Date(protocol.created_at)
    pdf.text(`Erstellt am ${protocolDate.toLocaleDateString('de-DE')} um ${protocolDate.toLocaleTimeString('de-DE')}`, 105, yPos + 18, { align: 'center' })
    pdf.setTextColor(0); yPos += 40

    // STAMMDATEN
    pdf.setFillColor(240, 249, 245)
    pdf.roundedRect(15, yPos, 180, 38, 3, 3, 'F')
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Mietvorgang', 20, yPos + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Vertragsnummer: ${rental.rental_number}`, 20, yPos + 16)
    pdf.text(`Kunde: ${rental.customer_name}`, 20, yPos + 23)
    pdf.text(`Fahrzeug: ${rental.vehicle_manufacturer} ${rental.vehicle_model}`, 110, yPos + 16)
    pdf.text(`Kennzeichen: ${rental.vehicle_license_plate || '-'}`, 110, yPos + 23)
    pdf.text(`Durchgeführt von: ${protocol.completed_by}`, 20, yPos + 30)
    yPos += 48

    // FAHRZEUGDATEN
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Fahrzeugdaten', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
    pdf.text(`Kilometerstand: ${protocol.mileage} km`, 15, yPos)
    pdf.text(`Tankstand: ${protocol.fuel_level}`, 80, yPos); yPos += 6
    pdf.text(`Frischwasser: ${protocol.fresh_water_tank}`, 15, yPos)
    pdf.text(`Abwasser: ${protocol.waste_water_tank}`, 80, yPos); yPos += 12

    // ÄUSSERER ZUSTAND
    yPos = checkPageBreak(pdf, yPos, 50)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Äußerer Zustand', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    if (exterior) {
      const exteriorLabels = {
        paint_body: 'Lack/Karosserie', windows_glass: 'Fenster/Scheiben',
        tires: 'Reifen', lighting: 'Beleuchtung', roof_skylight: 'Dach/Dachluke',
        doors_locks: 'Türen/Schlösser', awning: 'Markise', trailer_hitch: 'Anhängerkupplung'
      }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(exteriorLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const status = exterior[key]?.status || (exterior[key]?.present !== undefined ? (exterior[key].present ? 'Vorhanden' : 'Nicht vorhanden') : '-')
        pdf.text(`${exteriorLabels[key]}: ${getStatusLabel(status)}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
    } else {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150)
      pdf.text('Keine Daten vorhanden', 15, yPos); pdf.setTextColor(0); yPos += 6
    }
    yPos += 8

    // INNENAUSSTATTUNG
    yPos = checkPageBreak(pdf, yPos, 50)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Innenausstattung', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    if (interior) {
      const interiorLabels = {
        upholstery_seats: 'Polster/Sitze', carpet_flooring: 'Teppich/Boden',
        walls_panels: 'Wände/Verkleidung', windows_blinds: 'Fenster/Rollos',
        kitchen_stove: 'Küche/Kocher', refrigerator: 'Kühlschrank',
        heating: 'Heizung', toilet_shower: 'Toilette/Dusche',
        sink_faucet: 'Waschbecken', interior_lighting: 'Beleuchtung innen',
        gas_system: 'Gasanlage', battery_power: 'Batterie/Strom'
      }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(interiorLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const status = interior[key]?.status || '-'
        pdf.text(`${interiorLabels[key]}: ${getStatusLabel(status)}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
    } else {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150)
      pdf.text('Keine Daten vorhanden', 15, yPos); pdf.setTextColor(0); yPos += 6
    }
    yPos += 8

    // AUSRÜSTUNG
    yPos = checkPageBreak(pdf, yPos, 40)
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Ausrüstung & Inventar', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 6
    if (equipment) {
      const eqLabels = {
        spare_tire: 'Ersatzrad', jack: 'Wagenheber', tool_kit: 'Werkzeugset',
        first_aid_kit: 'Verbandskasten', warning_triangle: 'Warndreieck',
        safety_vests: 'Warnwesten', fire_extinguisher: 'Feuerlöscher',
        dishes_cutlery: 'Geschirr/Besteck', bedding: 'Bettwäsche',
        towels: 'Handtücher', camping_furniture: 'Campingmöbel',
        logbook: 'Fahrtenbuch', document_folder: 'Dokumentenmappe'
      }
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(eqLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const present = equipment[key]?.present !== undefined ? (equipment[key].present ? '[X]' : '[ ]') : '[X]'
        pdf.text(`${present} ${eqLabels[key]}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
      yPos += 4
      pdf.text(`Schlüssel: ${equipment.keys_count || '-'} Stück`, 15, yPos)
    } else {
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal'); pdf.setTextColor(150)
      pdf.text('Keine Daten vorhanden', 15, yPos); pdf.setTextColor(0); yPos += 6
    }
    yPos += 12

    // SCHÄDEN & NOTIZEN
    if (protocol.damage_notes) {
      yPos = checkPageBreak(pdf, yPos, 20)
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text('Schäden / Anmerkungen', 15, yPos)
      yPos += 7; pdf.setDrawColor(220, 38, 38); pdf.line(15, yPos, 195, yPos); yPos += 6
      pdf.setFontSize(10); pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(protocol.damage_notes, 180)
      pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 8
    }
    if (protocol.additional_notes) {
      yPos = checkPageBreak(pdf, yPos, 20)
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
      pdf.text('Zusätzliche Notizen', 15, yPos); yPos += 6
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10)
      const lines = pdf.splitTextToSize(protocol.additional_notes, 180)
      pdf.text(lines, 15, yPos); yPos += lines.length * 5 + 8
    }

    // FAHRZEUGFOTOS
    if (photoUrls.length > 0) {
      pdf.addPage(); yPos = 20
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text(`Fahrzeugfotos (${photoUrls.length})`, 15, yPos)
      yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 10
      let col = 0
      for (const url of photoUrls) {
        yPos = checkPageBreak(pdf, yPos, 75)
        const xPos = col === 0 ? 15 : 105
        const imgData = await loadImageAsBase64(url)
        if (imgData) {
          try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 60) } catch (e) {
            pdf.setFontSize(8); pdf.setTextColor(150); pdf.text('[Foto nicht verfügbar]', xPos + 5, yPos + 30); pdf.setTextColor(0)
          }
        } else {
          pdf.setFontSize(8); pdf.setTextColor(150); pdf.text('[Foto nicht verfügbar]', xPos + 5, yPos + 30); pdf.setTextColor(0)
        }
        if (col === 1) yPos += 70
        col = col === 0 ? 1 : 0
      }
      if (col === 1) yPos += 70
    }

    // AUSWEISDOKUMENTE
    if (idPhotos.length > 0 || licensePhotos.length > 0) {
      pdf.addPage(); yPos = 20
      pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
      pdf.text('Ausweisdokumente', 15, yPos)
      yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 10
      if (idPhotos.length > 0) {
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
        pdf.text('Personalausweis:', 15, yPos); yPos += 8
        let col = 0
        for (const url of idPhotos) {
          const xPos = col === 0 ? 15 : 105
          const imgData = await loadImageAsBase64(url)
          if (imgData) { try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 55) } catch (e) {} }
          if (col === 1) yPos += 65
          col = col === 0 ? 1 : 0
        }
        if (col === 1) yPos += 65
        yPos += 8
      }
      if (licensePhotos.length > 0) {
        yPos = checkPageBreak(pdf, yPos, 70)
        pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
        pdf.text('Führerschein:', 15, yPos); yPos += 8
        let col = 0
        for (const url of licensePhotos) {
          const xPos = col === 0 ? 15 : 105
          const imgData = await loadImageAsBase64(url)
          if (imgData) { try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 55) } catch (e) {} }
          if (col === 1) yPos += 65
          col = col === 0 ? 1 : 0
        }
        if (col === 1) yPos += 65
      }
    }

    // UNTERSCHRIFTEN
    pdf.addPage(); yPos = 20
    pdf.setFontSize(13); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschriften', 15, yPos)
    yPos += 7; pdf.setDrawColor(16, 185, 129); pdf.line(15, yPos, 195, yPos); yPos += 15

    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mieter:', 15, yPos); yPos += 8
    if (protocol.customer_signature) {
      const sigData = await prepareSignature(protocol.customer_signature)
      if (sigData) { try { pdf.addImage(sigData, 'JPEG', 15, yPos, 85, 35) } catch (e) {} }
    }
    pdf.setDrawColor(100); pdf.line(15, yPos + 38, 100, yPos + 38)
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
    pdf.text(`${rental.customer_name}`, 15, yPos + 44)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')}`, 15, yPos + 50)

    yPos -= 8
    pdf.setFontSize(11); pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mitarbeiter:', 110, yPos); yPos += 8
    if (protocol.staff_signature) {
      const sigData = await prepareSignature(protocol.staff_signature)
      if (sigData) { try { pdf.addImage(sigData, 'JPEG', 110, yPos, 85, 35) } catch (e) {} }
    }
    pdf.setDrawColor(100); pdf.line(110, yPos + 38, 195, yPos + 38)
    pdf.setFontSize(9); pdf.setFont('helvetica', 'normal')
    pdf.text(`${protocol.completed_by}`, 110, yPos + 44)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')}`, 110, yPos + 50)

    return pdf.output('datauristring').split(',')[1]

  } catch (error) {
    console.error('Fehler beim PDF Base64 Export:', error)
    throw error
  }
}