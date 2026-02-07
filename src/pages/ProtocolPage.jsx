import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import PhotoCapture from '../components/PhotoCapture'
import SignaturePad from '../components/SignaturePad'

export default function ProtocolPage() {
  const { rentalId, type } = useParams()
  const navigate = useNavigate()
  const [rental, setRental] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const [formData, setFormData] = useState({
    completed_by: '',
    mileage: '',
    fuel_level: 'full',
    fresh_water_tank: 'full',
    waste_water_tank: 'empty',
    
    exterior_condition: {
      paint_body: { status: 'good', notes: '' },
      windows_glass: { status: 'good', notes: '' },
      tires: { status: 'good', notes: '' },
      lighting: { status: 'working', notes: '' },
      roof_skylight: { status: 'good', notes: '' },
      doors_locks: { status: 'good', notes: '' },
      awning: { status: 'good', notes: '' },
      trailer_hitch: { present: false, notes: '' }
    },
    
    interior_condition: {
      upholstery_seats: { status: 'good', notes: '' },
      carpet_flooring: { status: 'good', notes: '' },
      walls_panels: { status: 'good', notes: '' },
      windows_blinds: { status: 'good', notes: '' },
      kitchen_stove: { status: 'working', notes: '' },
      refrigerator: { status: 'working', notes: '' },
      heating: { status: 'working', notes: '' },
      toilet_shower: { status: 'working', notes: '' },
      sink_faucet: { status: 'working', notes: '' },
      interior_lighting: { status: 'working', notes: '' },
      gas_system: { status: 'working', notes: '' },
      battery_power: { status: 'working', notes: '' }
    },
    
    equipment_checklist: {
      spare_tire: { present: true, condition: 'good', notes: '' },
      jack: { present: true, condition: 'good', notes: '' },
      tool_kit: { present: true, condition: 'good', notes: '' },
      first_aid_kit: { present: true, condition: 'good', notes: '' },
      warning_triangle: { present: true, condition: 'good', notes: '' },
      safety_vests: { present: true, condition: 'good', notes: '' },
      fire_extinguisher: { present: true, condition: 'good', notes: '' },
      dishes_cutlery: { present: true, status: 'complete', notes: '' },
      bedding: { present: true, status: 'clean', notes: '' },
      towels: { present: true, status: 'clean', notes: '' },
      camping_furniture: { present: true, status: 'complete', notes: '' },
      logbook: { present: true, notes: '' },
      document_folder: { present: true, notes: '' },
      keys_count: 2
    },
    
    damage_notes: '',
    additional_notes: '',
    photo_urls: [],
    id_card_photo: null,
    drivers_license_photo: null,
    customer_signature: null,
    staff_signature: null
  })

  useEffect(() => {
    loadRental()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rentalId, type])

  const loadRental = async () => {
    const { data, error } = await supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .eq('id', rentalId)
      .single()
    
    if (error) {
      alert('Fehler: ' + error.message)
      navigate('/')
      return
    }
    setRental(data)
    setLoading(false)
  }

  const handlePhotoAdded = (url) => {
    setFormData({
      ...formData,
      photo_urls: [...formData.photo_urls, url]
    })
  }

  const handleCustomerSignature = (dataUrl) => {
    setFormData({
      ...formData,
      customer_signature: dataUrl
    })
  }

  const handleStaffSignature = (dataUrl) => {
    setFormData({
      ...formData,
      staff_signature: dataUrl
    })
  }

  const handleSubmit = async () => {
    // Validierung
    if (!formData.mileage) {
      alert('Bitte Kilometerstand eingeben')
      return
    }
    if (!formData.completed_by) {
      alert('Bitte Name des Mitarbeiters eingeben')
      return
    }

    try {
      // Speichern
      const { error } = await supabase
        .from('OrcaCampers_handover_protocols')
        .insert({
          rental_id: rentalId,
          protocol_type: type,
          completed_by: formData.completed_by,
          mileage: parseInt(formData.mileage),
          fuel_level: formData.fuel_level,
          fresh_water_tank: formData.fresh_water_tank,
          waste_water_tank: formData.waste_water_tank,
          exterior_condition: formData.exterior_condition,
          interior_condition: formData.interior_condition,
          equipment_checklist: formData.equipment_checklist,
          damage_notes: formData.damage_notes,
          additional_notes: formData.additional_notes,
          photo_urls: formData.photo_urls,
          id_card_photo: formData.id_card_photo,
          drivers_license_photo: formData.drivers_license_photo,
          customer_signature: formData.customer_signature,
          staff_signature: formData.staff_signature
        })

      if (error) {
        console.error('Supabase Fehler:', error)
        alert('Fehler beim Speichern: ' + error.message)
        return
      }

      alert('✅ Protokoll erfolgreich gespeichert!')
      navigate('/')
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
  }

  if (loading) return <div style={styles.loading}>Lade...</div>
  if (!rental) return <div style={styles.loading}>Mietvorgang nicht gefunden</div>

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <img src="/logo.png" alt="Firmenlogo" style={styles.logo} />
        <h1 style={styles.title}>
          {type === 'handover' ? 'Übergabe' : 'Rückgabe'}
        </h1>
      </div>
      
      <div style={styles.infoCard}>
        <strong>Mietvorgang:</strong> {rental.rental_number}<br/>
        <strong>Kunde:</strong> {rental.customer_name}<br/>
        <strong>Fahrzeug:</strong> {rental.vehicle_manufacturer} {rental.vehicle_model} ({rental.vehicle_license_plate})
      </div>

      {/* Mitarbeiter */}
      <div style={styles.section}>
        <label style={styles.label}>Durchgeführt von: *</label>
        <input 
          type="text"
          placeholder="Dein Name"
          value={formData.completed_by}
          onChange={(e) => setFormData({...formData, completed_by: e.target.value})}
          style={styles.input}
        />
      </div>

      {/* Kilometerstand */}
      <div style={styles.section}>
        <label style={styles.label}>Kilometerstand: *</label>
        <input 
          type="number"
          placeholder="z.B. 45000"
          value={formData.mileage}
          onChange={(e) => setFormData({...formData, mileage: e.target.value})}
          style={styles.input}
        />
      </div>

      {/* Tankfüllung */}
      <div style={styles.section}>
        <label style={styles.label}>Tankstand:</label>
        <select
          value={formData.fuel_level}
          onChange={(e) => setFormData({...formData, fuel_level: e.target.value})}
          style={styles.select}
        >
          <option value="full">Voll</option>
          <option value="3/4">3/4</option>
          <option value="1/2">1/2</option>
          <option value="1/4">1/4</option>
          <option value="empty">Leer</option>
        </select>
      </div>

      {/* Wassertanks */}
      <div style={styles.section}>
        <label style={styles.label}>Frischwasser-Tank:</label>
        <select
          value={formData.fresh_water_tank}
          onChange={(e) => setFormData({...formData, fresh_water_tank: e.target.value})}
          style={styles.select}
        >
          <option value="full">Voll</option>
          <option value="partial">Teilweise</option>
          <option value="empty">Leer</option>
        </select>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Abwasser-Tank:</label>
        <select
          value={formData.waste_water_tank}
          onChange={(e) => setFormData({...formData, waste_water_tank: e.target.value})}
          style={styles.select}
        >
          <option value="empty">Leer</option>
          <option value="partial">Teilweise</option>
          <option value="full">Voll</option>
        </select>
      </div>

      {/* Äußerer Zustand */}
      <h2 style={styles.sectionTitle}>Äußerer Zustand</h2>
      
      {Object.keys(formData.exterior_condition).map(key => (
        <div key={key} style={styles.checkItem}>
          <label style={styles.checkLabel}>
            {getLabel(key)}:
          </label>
          <select
            value={formData.exterior_condition[key].status}
            onChange={(e) => setFormData({
              ...formData,
              exterior_condition: {
                ...formData.exterior_condition,
                [key]: { ...formData.exterior_condition[key], status: e.target.value }
              }
            })}
            style={styles.smallSelect}
          >
            <option value="good">Gut</option>
            <option value="fair">Befriedigend</option>
            <option value="damaged">Mangelhaft</option>
            <option value="working">Funktioniert</option>
            <option value="defect">Defekt</option>
          </select>
        </div>
      ))}

      {/* Innenausstattung */}
      <h2 style={styles.sectionTitle}>Innenausstattung</h2>
      
      {Object.keys(formData.interior_condition).map(key => (
        <div key={key} style={styles.checkItem}>
          <label style={styles.checkLabel}>
            {getLabel(key)}:
          </label>
          <select
            value={formData.interior_condition[key].status}
            onChange={(e) => setFormData({
              ...formData,
              interior_condition: {
                ...formData.interior_condition,
                [key]: { ...formData.interior_condition[key], status: e.target.value }
              }
            })}
            style={styles.smallSelect}
          >
            <option value="good">Gut</option>
            <option value="fair">Befriedigend</option>
            <option value="damaged">Mangelhaft</option>
            <option value="working">Funktioniert</option>
            <option value="defect">Defekt</option>
          </select>
        </div>
      ))}

      {/* Ausweisdokumente des Mieters */}
      <h2 style={styles.sectionTitle}>Ausweisdokumente des Mieters</h2>

      <div style={styles.section}>
        <label style={styles.label}>Personalausweis (Vorder- und Rückseite):</label>
        <PhotoCapture 
          protocolId={`${rentalId}-id-card`}
          onPhotoAdded={(url) => setFormData(prev => ({...prev, id_card_photo: url}))}
          label="📸 Personalausweis fotografieren"
        />
        {formData.id_card_photo && (
          <div style={styles.documentPhotoPreview}>
            <img src={formData.id_card_photo} alt="Personalausweis" style={styles.documentPhoto} />
            <button 
              type="button"
              onClick={() => setFormData(prev => ({...prev, id_card_photo: null}))}
              style={styles.removePhotoButton}
            >
              ✕ Entfernen
            </button>
          </div>
        )}
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Führerschein (Vorder- und Rückseite):</label>
        <PhotoCapture 
          protocolId={`${rentalId}-drivers-license`}
          onPhotoAdded={(url) => setFormData(prev => ({...prev, drivers_license_photo: url}))}
          label="📸 Führerschein fotografieren"
        />
        {formData.drivers_license_photo && (
          <div style={styles.documentPhotoPreview}>
            <img src={formData.drivers_license_photo} alt="Führerschein" style={styles.documentPhoto} />
            <button 
              type="button"
              onClick={() => setFormData(prev => ({...prev, drivers_license_photo: null}))}
              style={styles.removePhotoButton}
            >
              ✕ Entfernen
            </button>
          </div>
        )}
      </div>

      {/* Fotos */}
      <h2 style={styles.sectionTitle}>Fahrzeugfotos</h2>
      <PhotoCapture 
        protocolId={rentalId}
        onPhotoAdded={handlePhotoAdded}
        label="Foto aufnehmen"
      />
      
      <div style={styles.photoGrid}>
        {formData.photo_urls.map((url, i) => (
          <img 
            key={i} 
            src={url} 
            alt={`Foto ${i+1}`}
            style={styles.photo}
          />
        ))}
      </div>

      {/* Schäden */}
      <div style={styles.section}>
        <label style={styles.label}>Schäden/Anmerkungen:</label>
        <textarea
          value={formData.damage_notes}
          onChange={(e) => setFormData({...formData, damage_notes: e.target.value})}
          rows="4"
          placeholder="Beschreibe eventuelle Schäden..."
          style={styles.textarea}
        />
      </div>

      {/* Zusätzliche Notizen */}
      <div style={styles.section}>
        <label style={styles.label}>Zusätzliche Notizen:</label>
        <textarea
          value={formData.additional_notes}
          onChange={(e) => setFormData({...formData, additional_notes: e.target.value})}
          rows="3"
          placeholder="Weitere Anmerkungen..."
          style={styles.textarea}
        />
      </div>

      {/* Unterschriften */}
      <h2 style={styles.sectionTitle}>Unterschriften</h2>

      <SignaturePad 
        label="Unterschrift Mieter"
        onSave={handleCustomerSignature}
      />

      {formData.customer_signature && (
        <div style={styles.signaturePreview}>
          <p style={styles.previewLabel}>Gespeicherte Unterschrift Mieter:</p>
          <img 
            src={formData.customer_signature} 
            alt="Unterschrift Mieter"
            style={styles.signatureImage}
          />
        </div>
      )}

      <SignaturePad 
        label="Unterschrift Mitarbeiter/Vermieter"
        onSave={handleStaffSignature}
      />

      {formData.staff_signature && (
        <div style={styles.signaturePreview}>
          <p style={styles.previewLabel}>Gespeicherte Unterschrift Mitarbeiter:</p>
          <img 
            src={formData.staff_signature} 
            alt="Unterschrift Mitarbeiter"
            style={styles.signatureImage}
          />
        </div>
      )}

      {/* Buttons */}
      <button onClick={handleSubmit} style={styles.submitButton}>
        ✅ Protokoll speichern
      </button>

      <button onClick={() => navigate('/')} style={styles.cancelButton}>
        Abbrechen
      </button>
    </div>
  )
}

// Hilfsfunktion für Labels
function getLabel(key) {
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

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  logo: {
    maxWidth: '180px',
    height: 'auto',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#dbeafe',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '25px',
    fontSize: '14px',
    lineHeight: '1.6',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    marginTop: '30px',
    marginBottom: '15px',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '8px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '15px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  smallSelect: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  checkItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    marginBottom: '8px',
    backgroundColor: 'white',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
  },
  checkLabel: {
    fontSize: '14px',
    color: '#374151',
    flex: 1,
  },
  documentPhotoPreview: {
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #86efac',
    position: 'relative',
  },
  documentPhoto: {
    maxWidth: '100%',
    maxHeight: '300px',
    borderRadius: '8px',
    display: 'block',
    margin: '0 auto',
  },
  removePhotoButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    width: '100%',
  },
  photoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginTop: '15px',
    marginBottom: '20px',
  },
  photo: {
    width: '100%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
  },
  signaturePreview: {
    marginTop: '15px',
    marginBottom: '25px',
    padding: '15px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    border: '1px solid #86efac',
  },
  previewLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#166534',
    marginBottom: '10px',
  },
  signatureImage: {
    maxWidth: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  submitButton: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  cancelButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6b7280',
  }
}