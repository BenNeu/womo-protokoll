/* eslint-disable no-unused-vars */
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const generateProtocolPDF = async (protocol, rental) => {
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
    pdf.text('Übergabeprotokoll', 105, yPos + 10, { align: 'center' })
    
    yPos += 40

    // Protokoll-Typ
    const protocolType = protocol.protocol_type === 'handover' ? 'Übergabe' : 'Rücknahme'
    pdf.setFontSize(14)
    pdf.text(`Protokolltyp: ${protocolType}`, 15, yPos)
    yPos += 10

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

    // Datum
    const protocolDate = new Date(protocol.created_at)
    pdf.text(`Datum: ${protocolDate.toLocaleDateString('de-DE')} ${protocolDate.toLocaleTimeString('de-DE')}`, 15, yPos)
    yPos += 12

    // Linie
    pdf.setDrawColor(200, 200, 200)
    pdf.line(15, yPos, 195, yPos)
    yPos += 10

    // Fahrzeugzustand
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Fahrzeugzustand', 15, yPos)
    yPos += 8
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Kilometerstand: ${protocol.mileage} km`, 15, yPos)
    yPos += 6
    pdf.text(`Tankfuellung: ${protocol.fuel_level}`, 15, yPos)
    yPos += 6
    const cleanliness = protocol.cleanliness_interior === 'clean' ? 'Sauber' : 
                       protocol.cleanliness_interior === 'acceptable' ? 'Akzeptabel' : 'Verschmutzt'
    pdf.text(`Sauberkeit: ${cleanliness}`, 15, yPos)
    yPos += 10

    // Schäden
    if (protocol.damages && protocol.damages.length > 0) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Schaeden:', 15, yPos)
      yPos += 6
      pdf.setFont('helvetica', 'normal')
      const damagesText = pdf.splitTextToSize(protocol.damages, 180)
      pdf.text(damagesText, 15, yPos)
      yPos += (damagesText.length * 5) + 5
    }

    // Notizen
    if (protocol.notes) {
      pdf.setFont('helvetica', 'bold')
      pdf.text('Notizen:', 15, yPos)
      yPos += 6
      pdf.setFont('helvetica', 'normal')
      const notesText = pdf.splitTextToSize(protocol.notes, 180)
      pdf.text(notesText, 15, yPos)
      yPos += (notesText.length * 5) + 10
    }

    // Fotos
    if (protocol.photos && protocol.photos.length > 0) {
      if (yPos > 200) {
        pdf.addPage()
        yPos = 20
      }

      pdf.setFont('helvetica', 'bold')
      pdf.text('Fotos:', 15, yPos)
      yPos += 10

      // Fotos einfügen (2 pro Zeile)
      let photoX = 15
      let photoY = yPos
      const photoWidth = 85
      const photoHeight = 60

      for (let i = 0; i < protocol.photos.length; i++) {
        if (photoY + photoHeight > 270) {
          pdf.addPage()
          photoY = 20
        }

        try {
          pdf.addImage(protocol.photos[i], 'JPEG', photoX, photoY, photoWidth, photoHeight)
        } catch (e) {
          console.log('Foto konnte nicht eingefuegt werden')
        }

        if ((i + 1) % 2 === 0) {
          photoX = 15
          photoY += photoHeight + 10
        } else {
          photoX = 110
        }
      }

      yPos = photoY + photoHeight + 15
    }

    // Neue Seite für Unterschriften
    pdf.addPage()
    yPos = 20

    // Unterschriften
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Unterschriften', 15, yPos)
    yPos += 10

    // Vermieter
    pdf.setFontSize(10)
    pdf.text('Vermieter:', 15, yPos)
    yPos += 10
    if (protocol.landlord_signature) {
      try {
        pdf.addImage(protocol.landlord_signature, 'PNG', 15, yPos, 80, 30)
      } catch (e) {
        console.log('Vermieter-Unterschrift konnte nicht eingefuegt werden')
      }
    }
    yPos += 35
    pdf.line(15, yPos, 95, yPos)
    pdf.text('Datum, Unterschrift Vermieter', 15, yPos + 5)

    // Mieter
    yPos -= 45
    pdf.text('Mieter:', 110, yPos)
    yPos += 10
    if (protocol.customer_signature) {
      try {
        pdf.addImage(protocol.customer_signature, 'PNG', 110, yPos, 80, 30)
      } catch (e) {
        console.log('Mieter-Unterschrift konnte nicht eingefuegt werden')
      }
    }
    yPos += 35
    pdf.line(110, yPos, 190, yPos)
    pdf.text('Datum, Unterschrift Mieter', 110, yPos + 5)

    // PDF speichern
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

    // Neue Seite wenn nötig
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

      // Fotos einfügen (2 pro Zeile)
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

    // Neue Seite für Unterschrift
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

    // PDF speichern
    const fileName = `Aufbereitung_${rental.rental_number}_${cleaningDate.toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)

  } catch (error) {
    console.error('Fehler beim PDF-Export:', error)
    throw error
  }
}