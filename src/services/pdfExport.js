/* eslint-disable no-unused-vars */
import jsPDF from 'jspdf'

// Hilfsfunktion: Bild von URL laden und als Base64 zurückgeben
const loadImageAsBase64 = async (url) => {
  try {
   const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(String(url))}`
   console.log('Vollständige Proxy URL:', proxyUrl)
    const response = await fetch(proxyUrl)
    console.log('Response Status:', response.status, response.ok)
    const blob = await response.blob()
    console.log('Blob Typ:', blob.type, 'Größe:', blob.size)
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.log('Fehler:', e.message, 'URL:', url)
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

export const generateProtocolPDF = async (protocol, rental) => {
  try {
const pdf = new jsPDF('p', 'mm', 'a4')

let yPos = 20

    // ── HEADER ──────────────────────────────────────────
    const logoImg = new Image()
    logoImg.src = '/logo.png'
    await new Promise((resolve) => {
      logoImg.onload = resolve
      logoImg.onerror = resolve
    })
    try {
      pdf.addImage(logoImg, 'PNG', 15, yPos, 30, 30)
    } catch (e) {}

    const protocolType = protocol.protocol_type === 'handover' ? 'Übergabe' : 'Rücknahme'
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`${protocolType}protokoll`, 105, yPos + 10, { align: 'center' })
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100)
    const protocolDate = new Date(protocol.created_at)
    pdf.text(
      `Erstellt am ${protocolDate.toLocaleDateString('de-DE')} um ${protocolDate.toLocaleTimeString('de-DE')}`,
      105, yPos + 18, { align: 'center' }
    )
    pdf.setTextColor(0)
    yPos += 40

    // ── STAMMDATEN ───────────────────────────────────────
    pdf.setFillColor(240, 249, 245)
    pdf.roundedRect(15, yPos, 180, 38, 3, 3, 'F')
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Mietvorgang', 20, yPos + 8)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Vertragsnummer: ${rental.rental_number}`, 20, yPos + 16)
    pdf.text(`Kunde: ${rental.customer_name}`, 20, yPos + 23)
    pdf.text(`Fahrzeug: ${rental.vehicle_manufacturer} ${rental.vehicle_model}`, 110, yPos + 16)
    pdf.text(`Kennzeichen: ${rental.vehicle_license_plate || '-'}`, 110, yPos + 23)
    pdf.text(`Durchgeführt von: ${protocol.completed_by}`, 20, yPos + 30)
    yPos += 48

    // ── FAHRZEUGDATEN ────────────────────────────────────
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Fahrzeugdaten', 15, yPos)
    yPos += 7
    pdf.setDrawColor(16, 185, 129)
    pdf.line(15, yPos, 195, yPos)
    yPos += 6

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Kilometerstand: ${protocol.mileage} km`, 15, yPos)
    pdf.text(`Tankstand: ${protocol.fuel_level}`, 80, yPos)
    yPos += 6
    pdf.text(`Frischwasser: ${protocol.fresh_water_tank}`, 15, yPos)
    pdf.text(`Abwasser: ${protocol.waste_water_tank}`, 80, yPos)
    yPos += 12

    // ── ÄUSSERER ZUSTAND ─────────────────────────────────
    yPos = checkPageBreak(pdf, yPos, 50)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Äußerer Zustand', 15, yPos)
    yPos += 7
    pdf.setDrawColor(16, 185, 129)
    pdf.line(15, yPos, 195, yPos)
    yPos += 6

    if (protocol.exterior_condition) {
      const exterior = protocol.exterior_condition
      const exteriorLabels = {
        paint_body: 'Lack/Karosserie', windows_glass: 'Fenster/Scheiben',
        tires: 'Reifen', lighting: 'Beleuchtung', roof_skylight: 'Dach/Dachluke',
        doors_locks: 'Türen/Schlösser', awning: 'Markise', trailer_hitch: 'Anhängerkupplung'
      }
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
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
    }
    yPos += 8

    // ── INNENAUSSTATTUNG ─────────────────────────────────
    yPos = checkPageBreak(pdf, yPos, 50)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Innenausstattung', 15, yPos)
    yPos += 7
    pdf.setDrawColor(16, 185, 129)
    pdf.line(15, yPos, 195, yPos)
    yPos += 6

    if (protocol.interior_condition) {
      const interior = protocol.interior_condition
      const interiorLabels = {
        upholstery_seats: 'Polster/Sitze', carpet_flooring: 'Teppich/Boden',
        walls_panels: 'Wände/Verkleidung', windows_blinds: 'Fenster/Rollos',
        kitchen_stove: 'Küche/Kocher', refrigerator: 'Kühlschrank',
        heating: 'Heizung', toilet_shower: 'Toilette/Dusche',
        sink_faucet: 'Waschbecken', interior_lighting: 'Beleuchtung innen',
        gas_system: 'Gasanlage', battery_power: 'Batterie/Strom'
      }
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
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
    }
    yPos += 8

    // ── AUSRÜSTUNG ───────────────────────────────────────
    yPos = checkPageBreak(pdf, yPos, 40)
    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Ausrüstung & Inventar', 15, yPos)
    yPos += 7
    pdf.setDrawColor(16, 185, 129)
    pdf.line(15, yPos, 195, yPos)
    yPos += 6

    if (protocol.equipment_checklist) {
      const eq = protocol.equipment_checklist
      const eqLabels = {
        spare_tire: 'Ersatzrad', jack: 'Wagenheber', tool_kit: 'Werkzeugset',
        first_aid_kit: 'Verbandskasten', warning_triangle: 'Warndreieck',
        safety_vests: 'Warnwesten', fire_extinguisher: 'Feuerlöscher',
        dishes_cutlery: 'Geschirr/Besteck', bedding: 'Bettwäsche',
        towels: 'Handtücher', camping_furniture: 'Campingmöbel',
        logbook: 'Fahrtenbuch', document_folder: 'Dokumentenmappe'
      }
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      let col = 0
      Object.keys(eqLabels).forEach((key) => {
        yPos = checkPageBreak(pdf, yPos, 8)
        const xPos = col === 0 ? 15 : 105
        const present = eq[key]?.present !== undefined ? (eq[key].present ? '[X]' : '[ ]') : '[X]'
        pdf.text(`${present} ${eqLabels[key]}`, xPos, yPos)
        if (col === 1) yPos += 6
        col = col === 0 ? 1 : 0
      })
      if (col === 1) yPos += 6
      yPos += 4
      pdf.text(`Schlüssel: ${eq.keys_count || '-'} Stück`, 15, yPos)
    }
    yPos += 12

    // ── SCHÄDEN & NOTIZEN ────────────────────────────────
    if (protocol.damage_notes) {
      yPos = checkPageBreak(pdf, yPos, 20)
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Schäden / Anmerkungen', 15, yPos)
      yPos += 7
      pdf.setDrawColor(220, 38, 38)
      pdf.line(15, yPos, 195, yPos)
      yPos += 6
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const lines = pdf.splitTextToSize(protocol.damage_notes, 180)
      pdf.text(lines, 15, yPos)
      yPos += lines.length * 5 + 8
    }

    if (protocol.additional_notes) {
      yPos = checkPageBreak(pdf, yPos, 20)
      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Zusätzliche Notizen', 15, yPos)
      yPos += 6
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      const lines = pdf.splitTextToSize(protocol.additional_notes, 180)
      pdf.text(lines, 15, yPos)
      yPos += lines.length * 5 + 8
    }

    // ── FAHRZEUGFOTOS ────────────────────────────────────
    if (protocol.photo_urls && protocol.photo_urls.length > 0) {
      pdf.addPage()
      yPos = 20
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Fahrzeugfotos (${protocol.photo_urls.length})`, 15, yPos)
      yPos += 7
      pdf.setDrawColor(16, 185, 129)
      pdf.line(15, yPos, 195, yPos)
      yPos += 10

      let col = 0
      const photoW = 85, photoH = 60
      for (const url of protocol.photo_urls) {
        yPos = checkPageBreak(pdf, yPos, photoH + 15)
        const xPos = col === 0 ? 15 : 105
        const imgData = await loadImageAsBase64(url)
        if (imgData) {
          try {
            pdf.addImage(imgData, 'JPEG', xPos, yPos, photoW, photoH)
          } catch (e) {
            pdf.setFontSize(8)
            pdf.text('[Foto konnte nicht geladen werden]', xPos, yPos + 30)
          }
        }
        if (col === 1) yPos += photoH + 10
        col = col === 0 ? 1 : 0
      }
      if (col === 1) yPos += photoH + 10
    }

    // ── AUSWEISDOKUMENTE ─────────────────────────────────
    const hasIdPhotos = protocol.id_card_photos?.length > 0
    const hasLicensePhotos = protocol.drivers_license_photos?.length > 0

    if (hasIdPhotos || hasLicensePhotos) {
      pdf.addPage()
      yPos = 20
      pdf.setFontSize(13)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Ausweisdokumente', 15, yPos)
      yPos += 7
      pdf.setDrawColor(16, 185, 129)
      pdf.line(15, yPos, 195, yPos)
      yPos += 10

      if (hasIdPhotos) {
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Personalausweis:', 15, yPos)
        yPos += 8
        let col = 0
        for (const url of protocol.id_card_photos) {
          const xPos = col === 0 ? 15 : 105
          const imgData = await loadImageAsBase64(url)
          if (imgData) {
            try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 55) } catch (e) {}
          }
          if (col === 1) yPos += 65
          col = col === 0 ? 1 : 0
        }
        if (col === 1) yPos += 65
        yPos += 8
      }

      if (hasLicensePhotos) {
        yPos = checkPageBreak(pdf, yPos, 70)
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Führerschein:', 15, yPos)
        yPos += 8
        let col = 0
        for (const url of protocol.drivers_license_photos) {
          const xPos = col === 0 ? 15 : 105
          const imgData = await loadImageAsBase64(url)
          if (imgData) {
            try { pdf.addImage(imgData, 'JPEG', xPos, yPos, 85, 55) } catch (e) {}
          }
          if (col === 1) yPos += 65
          col = col === 0 ? 1 : 0
        }
      }
    }

    // ── UNTERSCHRIFTEN ───────────────────────────────────
    pdf.addPage()
    yPos = 20

    pdf.setFontSize(13)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschriften', 15, yPos)
    yPos += 7
    pdf.setDrawColor(16, 185, 129)
    pdf.line(15, yPos, 195, yPos)
    yPos += 15

    // Mieter
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mieter:', 15, yPos)
    yPos += 8
    if (protocol.customer_signature) {
      const sigData = await loadImageAsBase64(protocol.customer_signature)
      if (sigData) {
        try { pdf.addImage(sigData, 'PNG', 15, yPos, 85, 35) } catch (e) {}
      }
    }
    pdf.setDrawColor(100)
    pdf.line(15, yPos + 38, 100, yPos + 38)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${rental.customer_name}`, 15, yPos + 44)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')}`, 15, yPos + 50)

    // Mitarbeiter
    yPos -= 8
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mitarbeiter:', 110, yPos)
    yPos += 8
    if (protocol.staff_signature) {
      const sigData = await loadImageAsBase64(protocol.staff_signature)
      if (sigData) {
        try { pdf.addImage(sigData, 'PNG', 110, yPos, 85, 35) } catch (e) {}
      }
    }
    pdf.setDrawColor(100)
    pdf.line(110, yPos + 38, 195, yPos + 38)
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${protocol.completed_by}`, 110, yPos + 44)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')}`, 110, yPos + 50)

    // ── SPEICHERN ────────────────────────────────────────
    const fileName = `${protocolType}_${rental.rental_number}_${protocolDate.toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

  } catch (error) {
    console.error('Fehler beim PDF-Export:', error)
    throw error
  }
}

export const generateCleaningProtocolPDF = async (protocol, rental) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    let yPos = 20

    // Header mit Logo
    const logoImg = new Image()
    logoImg.src = '/logo.png'
    await new Promise((resolve) => {
      logoImg.onload = resolve
      logoImg.onerror = resolve
    })

    try {
      pdf.addImage(logoImg, 'PNG', 15, yPos, 30, 30)
    } catch (e) {
      console.log('Logo konnte nicht geladen werden')
    }

    // Titel
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Fahrzeug-Aufbereitungs-Protokoll', 105, yPos + 10, { align: 'center' })

    yPos += 40

    // Fahrzeug-Info
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Fahrzeug: ${rental.vehicle_manufacturer} ${rental.vehicle_model}`, 15, yPos)
    yPos += 7
    pdf.text(`Kennzeichen: ${rental.vehicle_license_plate}`, 15, yPos)
    yPos += 7
    pdf.text(`Vertragsnummer: ${rental.rental_number}`, 15, yPos)
    yPos += 7
    pdf.text(`Kunde: ${rental.customer_name}`, 15, yPos)
    yPos += 10

    // Mitarbeiter & Datum
    pdf.setFont('helvetica', 'bold')
    pdf.text(`Mitarbeiter: ${protocol.employee_name}`, 15, yPos)
    yPos += 7
    pdf.setFont('helvetica', 'normal')
    const cleaningDate = new Date(protocol.cleaning_date)
    pdf.text(`Datum: ${cleaningDate.toLocaleDateString('de-DE')} ${cleaningDate.toLocaleTimeString('de-DE')}`, 15, yPos)
    yPos += 12

    // Linie
    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, yPos, 195, yPos)
    yPos += 10

    // Kategorie 1: Außen & Technik
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('1. Aussen & Technik', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const section1 = [
      { label: 'Aussenwaesche', value: protocol.exterior_wash },
      { label: 'Sichtpruefung Karosserie', value: protocol.exterior_inspection },
      { label: 'Reifen pruefen', value: protocol.tire_check },
      { label: 'Scheiben & Spiegel', value: protocol.windows_mirrors },
      { label: 'Markise reinigen', value: protocol.awning_clean },
      { label: 'Dach / Solarpanels', value: protocol.roof_check },
      { label: 'Unterboden', value: protocol.underbody_check },
    ]

    section1.forEach(item => {
      const checkbox = item.value ? '[X]' : '[ ]'
      pdf.text(`${checkbox} ${item.label}`, 20, yPos)
      yPos += 6
    })
    yPos += 5

    // Kategorie 2: Innenraum
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('2. Innenraum - Reinigung', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const section2 = [
      { label: 'Komplett saugen', value: protocol.vacuum_interior },
      { label: 'Boden wischen', value: protocol.mop_floor },
      { label: 'Kueche reinigen', value: protocol.kitchen_clean },
      { label: 'Kuehlschrank', value: protocol.fridge_clean },
      { label: 'Bad & WC', value: protocol.bathroom_clean },
      { label: 'WC-Kassette leeren', value: protocol.toilet_empty },
      { label: 'Muelleimer leeren', value: protocol.trash_empty },
      { label: 'Fenster innen', value: protocol.windows_inside },
      { label: 'Geruchskontrolle', value: protocol.odor_check },
    ]

    section2.forEach(item => {
      const checkbox = item.value ? '[X]' : '[ ]'
      pdf.text(`${checkbox} ${item.label}`, 20, yPos)
      yPos += 6
    })
    yPos += 5

    if (yPos > 240) {
      pdf.addPage()
      yPos = 20
    }

    // Kategorie 3: Wasser, Gas & Strom
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('3. Wasser, Gas & Strom', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const section3 = [
      { label: 'Frischwassertank', value: protocol.freshwater_fill },
      { label: 'Abwassertank leeren', value: protocol.wastewater_empty },
      { label: 'WC-Zusatz', value: protocol.toilet_additive },
      { label: 'Gasflaschen', value: protocol.gas_check },
      { label: 'Stromanschluss', value: protocol.power_check },
      { label: 'Batterie', value: protocol.battery_check },
    ]

    section3.forEach(item => {
      const checkbox = item.value ? '[X]' : '[ ]'
      pdf.text(`${checkbox} ${item.label}`, 20, yPos)
      yPos += 6
    })
    yPos += 5

    // Kategorie 4: Ausstattung & Inventar
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('4. Ausstattung & Inventar', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    const section4 = [
      { label: 'Geschirr & Besteck', value: protocol.dishes_complete },
      { label: 'Toepfe, Pfannen', value: protocol.cookware_complete },
      { label: 'Campingmoebel', value: protocol.camping_furniture },
      { label: 'Auffahrkeile', value: protocol.ramps },
      { label: 'Stromkabel', value: protocol.power_cable },
      { label: 'Wasserschlauch', value: protocol.water_hose },
      { label: 'Warnweste, Verbandskasten', value: protocol.safety_equipment },
      { label: 'Bedienungsanleitungen', value: protocol.manuals_present },
    ]

    section4.forEach(item => {
      const checkbox = item.value ? '[X]' : '[ ]'
      pdf.text(`${checkbox} ${item.label}`, 20, yPos)
      yPos += 6
    })
    yPos += 5

    // Neue Seite
    pdf.addPage()
    yPos = 20

    // Kategorie 5: Fahrzeug & Sicherheit
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('5. Fahrzeug & Sicherheit', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    pdf.text(`Kilometerstand: ${protocol.mileage} km`, 20, yPos)
    yPos += 6
    pdf.text(`Tankstand: ${protocol.fuel_level}`, 20, yPos)
    yPos += 8

    const section5 = [
      { label: 'Oelstand / Kuehlwasser', value: protocol.oil_check },
      { label: 'Fehlermeldungen', value: protocol.warning_lights },
      { label: 'Reifendruck', value: protocol.tire_pressure },
      { label: 'Schluessel vollstaendig', value: protocol.keys_complete },
    ]

    section5.forEach(item => {
      const checkbox = item.value ? '[X]' : '[ ]'
      pdf.text(`${checkbox} ${item.label}`, 20, yPos)
      yPos += 6
    })
    yPos += 10

    // Kategorie 6: Dokumentation
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('6. Dokumentation', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')

    if (protocol.notes) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Notizen / Schaeden:', 20, yPos)
      yPos += 6
      pdf.setFont('helvetica', 'normal')
      const notesLines = pdf.splitTextToSize(protocol.notes, 170)
      pdf.text(notesLines, 20, yPos)
      yPos += (notesLines.length * 6) + 5
    }

    if (protocol.special_remarks) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Besonderheiten:', 20, yPos)
      yPos += 6
      pdf.setFont('helvetica', 'normal')
      const remarksLines = pdf.splitTextToSize(protocol.special_remarks, 170)
      pdf.text(remarksLines, 20, yPos)
      yPos += (remarksLines.length * 6) + 5
    }

    // Fotos
    if (protocol.damage_photos && protocol.damage_photos.length > 0) {
      yPos += 5
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Fotos: ${protocol.damage_photos.length} Bild(er) aufgenommen`, 20, yPos)
      yPos += 10

      let photoX = 20
      let photoY = yPos
      const photoWidth = 80
      const photoHeight = 60

      for (let i = 0; i < protocol.damage_photos.length; i++) {
        if (photoY + photoHeight > 270) {
          pdf.addPage()
          photoY = 20
        }

        try {
          pdf.addImage(protocol.damage_photos[i], 'JPEG', photoX, photoY, photoWidth, photoHeight)
          pdf.setFontSize(8)
          pdf.text(`Foto ${i + 1}`, photoX, photoY + photoHeight + 4)
        } catch (e) {
          console.log('Foto konnte nicht eingefuegt werden:', e)
        }

        if ((i + 1) % 2 === 0) {
          photoX = 20
          photoY += photoHeight + 10
        } else {
          photoX = 110
        }
      }

      yPos = photoY + photoHeight + 15
    }

    if (yPos > 200) {
      pdf.addPage()
      yPos = 20
    }

    yPos += 10

    // Unterschrift
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschrift Mitarbeiter:', 15, yPos)
    yPos += 10

    if (protocol.employee_signature) {
      try {
        pdf.addImage(protocol.employee_signature, 'PNG', 15, yPos, 80, 30)
      } catch (e) {
        console.log('Unterschrift konnte nicht eingefuegt werden')
      }
      yPos += 35
    }

    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${protocol.employee_name}`, 15, yPos)
    yPos += 5
    pdf.text(`${cleaningDate.toLocaleDateString('de-DE')}`, 15, yPos)

    const fileName = `Aufbereitung_${rental.rental_number}_${cleaningDate.toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

  } catch (error) {
    console.error('Fehler beim PDF-Export:', error)
    throw error
  }
}