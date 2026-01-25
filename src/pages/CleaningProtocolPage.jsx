import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import SignaturePad from '../components/SignaturePad'
import PhotoCapture from '../components/PhotoCapture'

export default function CleaningProtocolPage() {
  const { rentalId } = useParams()
  const navigate = useNavigate()
  const [rental, setRental] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Mitarbeiter
  const [employeeName, setEmployeeName] = useState('')
  
  // 1. Außen & Technik
  const [exteriorWash, setExteriorWash] = useState(false)
  const [exteriorInspection, setExteriorInspection] = useState(false)
  const [tireCheck, setTireCheck] = useState(false)
  const [windowsMirrors, setWindowsMirrors] = useState(false)
  const [awningClean, setAwningClean] = useState(false)
  const [roofCheck, setRoofCheck] = useState(false)
  const [underbodyCheck, setUnderbodyCheck] = useState(false)
  
  // 2. Innenraum
  const [vacuumInterior, setVacuumInterior] = useState(false)
  const [mopFloor, setMopFloor] = useState(false)
  const [kitchenClean, setKitchenClean] = useState(false)
  const [fridgeClean, setFridgeClean] = useState(false)
  const [bathroomClean, setBathroomClean] = useState(false)
  const [toiletEmpty, setToiletEmpty] = useState(false)
  const [trashEmpty, setTrashEmpty] = useState(false)
  const [windowsInside, setWindowsInside] = useState(false)
  const [odorCheck, setOdorCheck] = useState(false)
  
  // 3. Wasser, Gas & Strom
  const [freshwaterFill, setFreshwaterFill] = useState(false)
  const [wastewaterEmpty, setWastewaterEmpty] = useState(false)
  const [toiletAdditive, setToiletAdditive] = useState(false)
  const [gasCheck, setGasCheck] = useState(false)
  const [powerCheck, setPowerCheck] = useState(false)
  const [batteryCheck, setBatteryCheck] = useState(false)
  
  // 4. Ausstattung & Inventar
  const [dishesComplete, setDishesComplete] = useState(false)
  const [cookwareComplete, setCookwareComplete] = useState(false)
  const [campingFurniture, setCampingFurniture] = useState(false)
  const [ramps, setRamps] = useState(false)
  const [powerCable, setPowerCable] = useState(false)
  const [waterHose, setWaterHose] = useState(false)
  const [safetyEquipment, setSafetyEquipment] = useState(false)
  const [manualsPresent, setManualsPresent] = useState(false)
  
  // 5. Fahrzeug & Sicherheit
  const [mileage, setMileage] = useState('')
  const [fuelLevel, setFuelLevel] = useState('full')
  const [oilCheck, setOilCheck] = useState(false)
  const [warningLights, setWarningLights] = useState(false)
  const [tirePressure, setTirePressure] = useState(false)
  const [keysComplete, setKeysComplete] = useState(false)
  
  // 6. Dokumentation
  const [notes, setNotes] = useState('')
  const [specialRemarks, setSpecialRemarks] = useState('')
  const [photos, setPhotos] = useState([])
  const [signature, setSignature] = useState('')

  useEffect(() => {
    loadRental()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId])

  const loadRental = async () => {
    const { data, error } = await supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .eq('id', rentalId)
      .single()

    if (error) {
      alert('Fehler beim Laden: ' + error.message)
      navigate('/admin')
      return
    }

    setRental(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!employeeName.trim()) {
      alert('Bitte Namen des Mitarbeiters eingeben')
      return
    }

    if (!signature) {
      alert('Bitte Unterschrift hinzufügen')
      return
    }

    const protocolData = {
      rental_id: rentalId,
      employee_name: employeeName,
      cleaning_date: new Date().toISOString(),
      
      exterior_wash: exteriorWash,
      exterior_inspection: exteriorInspection,
      tire_check: tireCheck,
      windows_mirrors: windowsMirrors,
      awning_clean: awningClean,
      roof_check: roofCheck,
      underbody_check: underbodyCheck,
      
      vacuum_interior: vacuumInterior,
      mop_floor: mopFloor,
      kitchen_clean: kitchenClean,
      fridge_clean: fridgeClean,
      bathroom_clean: bathroomClean,
      toilet_empty: toiletEmpty,
      trash_empty: trashEmpty,
      windows_inside: windowsInside,
      odor_check: odorCheck,
      
      freshwater_fill: freshwaterFill,
      wastewater_empty: wastewaterEmpty,
      toilet_additive: toiletAdditive,
      gas_check: gasCheck,
      power_check: powerCheck,
      battery_check: batteryCheck,
      
      dishes_complete: dishesComplete,
      cookware_complete: cookwareComplete,
      camping_furniture: campingFurniture,
      ramps: ramps,
      power_cable: powerCable,
      water_hose: waterHose,
      safety_equipment: safetyEquipment,
      manuals_present: manualsPresent,
      
      mileage: parseInt(mileage) || 0,
      fuel_level: fuelLevel,
      oil_check: oilCheck,
      warning_lights: warningLights,
      tire_pressure: tirePressure,
      keys_complete: keysComplete,
      
      notes: notes,
      special_remarks: specialRemarks,
      damage_photos: photos,
      employee_signature: signature
    }

    const { error } = await supabase
      .from('OrcaCampers_cleaning_protocols')
      .insert([protocolData])

    if (error) {
      alert('Fehler beim Speichern: ' + error.message)
      return
    }

    alert('✅ Aufbereitungs-Protokoll erfolgreich gespeichert!')
    navigate('/admin')
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Lade Daten...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src="/logo.png" alt="Logo" style={styles.logo} />
        <h1 style={styles.title}>Fahrzeug-Aufbereitung</h1>
        <p style={styles.subtitle}>
          {rental.vehicle_manufacturer} {rental.vehicle_model} ({rental.vehicle_license_plate})
        </p>
        <p style={styles.rentalInfo}>Vertrag: {rental.rental_number}</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Mitarbeiter</h2>
          <input
            type="text"
            placeholder="Name des Mitarbeiters"
            value={employeeName}
            onChange={(e) => setEmployeeName(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>1️⃣ Außen & Technik</h2>
          <CheckboxItem label="Außenwäsche (Dach, Markise, Felgen)" checked={exteriorWash} onChange={setExteriorWash} />
          <CheckboxItem label="Sichtprüfung Karosserie (Kratzer, Dellen)" checked={exteriorInspection} onChange={setExteriorInspection} />
          <CheckboxItem label="Reifen prüfen (Profil, Luftdruck)" checked={tireCheck} onChange={setTireCheck} />
          <CheckboxItem label="Scheiben & Spiegel reinigen" checked={windowsMirrors} onChange={setWindowsMirrors} />
          <CheckboxItem label="Markise reinigen & trocknen" checked={awningClean} onChange={setAwningClean} />
          <CheckboxItem label="Dach / Solarpanels prüfen" checked={roofCheck} onChange={setRoofCheck} />
          <CheckboxItem label="Unterboden grob prüfen" checked={underbodyCheck} onChange={setUnderbodyCheck} />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>2️⃣ Innenraum – Reinigung</h2>
          <CheckboxItem label="Komplett saugen (inkl. Polster, Fahrerhaus)" checked={vacuumInterior} onChange={setVacuumInterior} />
          <CheckboxItem label="Boden wischen" checked={mopFloor} onChange={setMopFloor} />
          <CheckboxItem label="Küche reinigen (Herd, Spüle, Kühlschrank)" checked={kitchenClean} onChange={setKitchenClean} />
          <CheckboxItem label="Kühlschrank aus, offen, trocken" checked={fridgeClean} onChange={setFridgeClean} />
          <CheckboxItem label="Bad & WC reinigen / desinfizieren" checked={bathroomClean} onChange={setBathroomClean} />
          <CheckboxItem label="WC-Kassette leeren & spülen" checked={toiletEmpty} onChange={setToiletEmpty} />
          <CheckboxItem label="Mülleimer leeren" checked={trashEmpty} onChange={setTrashEmpty} />
          <CheckboxItem label="Fenster innen reinigen" checked={windowsInside} onChange={setWindowsInside} />
          <CheckboxItem label="Geruchskontrolle (ggf. Ozon)" checked={odorCheck} onChange={setOdorCheck} />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>3️⃣ Wasser, Gas & Strom</h2>
          <CheckboxItem label="Frischwassertank spülen / neu befüllen" checked={freshwaterFill} onChange={setFreshwaterFill} />
          <CheckboxItem label="Abwassertank leeren" checked={wastewaterEmpty} onChange={setWastewaterEmpty} />
          <CheckboxItem label="WC-Zusatz auffüllen" checked={toiletAdditive} onChange={setToiletAdditive} />
          <CheckboxItem label="Gasflaschen prüfen (Füllstand)" checked={gasCheck} onChange={setGasCheck} />
          <CheckboxItem label="Stromanschluss & Kabel prüfen" checked={powerCheck} onChange={setPowerCheck} />
          <CheckboxItem label="Batterie / Bordspannung checken" checked={batteryCheck} onChange={setBatteryCheck} />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>4️⃣ Ausstattung & Inventar</h2>
          <CheckboxItem label="Geschirr & Besteck vollständig" checked={dishesComplete} onChange={setDishesComplete} />
          <CheckboxItem label="Töpfe, Pfannen, Kaffeemaschine ok" checked={cookwareComplete} onChange={setCookwareComplete} />
          <CheckboxItem label="Campingmöbel (Stühle, Tisch)" checked={campingFurniture} onChange={setCampingFurniture} />
          <CheckboxItem label="Auffahrkeile" checked={ramps} onChange={setRamps} />
          <CheckboxItem label="Stromkabel, Adapter" checked={powerCable} onChange={setPowerCable} />
          <CheckboxItem label="Wasserschlauch, Gießkanne" checked={waterHose} onChange={setWaterHose} />
          <CheckboxItem label="Warnweste, Warndreieck, Verbandskasten" checked={safetyEquipment} onChange={setSafetyEquipment} />
          <CheckboxItem label="Bedienungsanleitungen vorhanden" checked={manualsPresent} onChange={setManualsPresent} />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>5️⃣ Fahrzeug & Sicherheit</h2>
          
          <label style={styles.label}>Kilometerstand:</label>
          <input
            type="number"
            placeholder="z.B. 12345"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            style={styles.input}
          />

          <label style={styles.label}>Tankstand:</label>
          <select value={fuelLevel} onChange={(e) => setFuelLevel(e.target.value)} style={styles.select}>
            <option value="full">Voll</option>
            <option value="3/4">3/4</option>
            <option value="1/2">1/2</option>
            <option value="1/4">1/4</option>
            <option value="empty">Leer</option>
          </select>

          <CheckboxItem label="Ölstand / Kühlwasser Sichtprüfung" checked={oilCheck} onChange={setOilCheck} />
          <CheckboxItem label="Fehlermeldungen im Cockpit prüfen" checked={warningLights} onChange={setWarningLights} />
          <CheckboxItem label="Reifendruck ggf. korrigieren" checked={tirePressure} onChange={setTirePressure} />
          <CheckboxItem label="Schlüssel (Anzahl vollständig)" checked={keysComplete} onChange={setKeysComplete} />
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>6️⃣ Dokumentation</h2>
          
          <label style={styles.label}>Notizen / Schäden:</label>
          <textarea
            placeholder="Neue Schäden, Besonderheiten..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={styles.textarea}
            rows={4}
          />

          <label style={styles.label}>Besonderheiten für nächsten Gast:</label>
          <textarea
            placeholder="Wichtige Hinweise..."
            value={specialRemarks}
            onChange={(e) => setSpecialRemarks(e.target.value)}
            style={styles.textarea}
            rows={3}
          />

          <label style={styles.label}>Fotos (Schäden, Zustand):</label>
          <PhotoCapture onCapture={(photo) => setPhotos([...photos, photo])} />
          
          {photos.length > 0 && (
            <div style={styles.photoPreview}>
              <p style={styles.photoCount}>{photos.length} Foto(s) aufgenommen</p>
              <div style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <div key={index} style={styles.photoItem}>
                    <img src={photo} alt={`Foto ${index + 1}`} style={styles.photoImage} />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
                      style={styles.photoDeleteButton}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Unterschrift Mitarbeiter</h2>
          <SignaturePad onSave={setSignature} />
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={() => navigate('/admin')} style={styles.cancelButton}>
            Abbrechen
          </button>
          <button type="submit" style={styles.submitButton}>
            ✅ Aufbereitung abschließen
          </button>
        </div>
      </form>
    </div>
  )
}

function CheckboxItem({ label, checked, onChange }) {
  return (
    <label style={styles.checkboxLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={styles.checkbox}
      />
      <span style={styles.checkboxText}>{label}</span>
    </label>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  logo: {
    maxWidth: '120px',
    height: 'auto',
    marginBottom: '15px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 10px 0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '5px 0',
  },
  rentalInfo: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: '5px 0',
  },
  form: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '15px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '15px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '15px',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '15px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'background-color 0.2s',
  },
  checkbox: {
    width: '20px',
    height: '20px',
    marginRight: '12px',
    cursor: 'pointer',
  },
  checkboxText: {
    fontSize: '15px',
    color: '#374151',
  },
  photoPreview: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  photoCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '10px',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '10px',
  },
  photoItem: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #e5e7eb',
  },
  photoImage: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    display: 'block',
  },
  photoDeleteButton: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    width: '28px',
    height: '28px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
  },
  cancelButton: {
    flex: 1,
    padding: '16px',
    fontSize: '16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: '16px',
    fontSize: '16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6b7280',
  },
}