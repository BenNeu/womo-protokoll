import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function VehicleFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    manufacturer: '',
    model: '',
    license_plate: '',
    vin: '',
    year: new Date().getFullYear(),
    vehicle_type: 'motorhome',
    fuel_type: 'diesel',
    transmission: 'manual',
    seats: 4,
    beds: 4,
    mileage: 0,
    equipment: [],
    features: '',
    daily_rate_default: 150.00,
    weekly_rate: 900.00,
    deposit_amount: 1500.00,
    status: 'available',
    notes: ''
  })

  const [equipmentInput, setEquipmentInput] = useState('')

  useEffect(() => {
    if (id) {
      loadVehicle()
    }
  }, [id])

  const loadVehicle = async () => {
    const { data, error } = await supabase
      .from('OrcaCampers_vehicles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      alert('Fehler beim Laden: ' + error.message)
      navigate('/vehicles')
      return
    }

    setFormData({
      ...data,
      equipment: data.equipment || []
    })
  }

  const handleAddEquipment = () => {
    if (!equipmentInput.trim()) return
    setFormData({
      ...formData,
      equipment: [...formData.equipment, equipmentInput.trim()]
    })
    setEquipmentInput('')
  }

  const handleRemoveEquipment = (index) => {
    setFormData({
      ...formData,
      equipment: formData.equipment.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const vehicleData = {
        manufacturer: formData.manufacturer,
        model: formData.model,
        license_plate: formData.license_plate,
        vin: formData.vin || null,
        year: parseInt(formData.year),
        vehicle_type: formData.vehicle_type,
        fuel_type: formData.fuel_type,
        transmission: formData.transmission,
        seats: parseInt(formData.seats),
        beds: parseInt(formData.beds),
        mileage: parseInt(formData.mileage),
        equipment: formData.equipment,
        features: formData.features,
        daily_rate_default: parseFloat(formData.daily_rate_default),
        weekly_rate: parseFloat(formData.weekly_rate),
        deposit_amount: parseFloat(formData.deposit_amount),
        status: formData.status,
        notes: formData.notes
      }

      if (id) {
        // Bearbeiten
        const { error } = await supabase
          .from('OrcaCampers_vehicles')
          .update(vehicleData)
          .eq('id', id)

        if (error) throw error
        alert('✅ Fahrzeug erfolgreich aktualisiert!')
      } else {
        // Neu anlegen
        const { error } = await supabase
          .from('OrcaCampers_vehicles')
          .insert(vehicleData)

        if (error) throw error
        alert('✅ Fahrzeug erfolgreich angelegt!')
      }

      navigate('/vehicles')
    } catch (error) {
      console.error('Fehler:', error)
      alert('Fehler beim Speichern: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>
        {id ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug anlegen'}
      </h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Basis-Informationen */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Basis-Informationen</h2>
          
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Hersteller *</label>
              <input
                type="text"
                required
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
                style={styles.input}
                placeholder="z.B. Fiat, Mercedes, VW"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Modell *</label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                style={styles.input}
                placeholder="z.B. Ducato Weinsberg CaraBus 600 DQ"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Kennzeichen *</label>
              <input
                type="text"
                required
                value={formData.license_plate}
                onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                style={styles.input}
                placeholder="z.B. WÜ-OC-123"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>FIN/VIN</label>
              <input
                type="text"
                value={formData.vin}
                onChange={(e) => setFormData({...formData, vin: e.target.value})}
                style={styles.input}
                placeholder="Fahrzeug-Identifikationsnummer"
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Baujahr</label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({...formData, year: e.target.value})}
                style={styles.input}
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Kilometerstand</label>
              <input
                type="number"
                value={formData.mileage}
                onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                style={styles.input}
                placeholder="Aktueller KM-Stand"
              />
            </div>
          </div>
        </div>

        {/* Technische Daten */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Technische Daten</h2>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Kraftstoff</label>
              <select
                value={formData.fuel_type}
                onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
                style={styles.select}
              >
                <option value="diesel">Diesel</option>
                <option value="gasoline">Benzin</option>
                <option value="electric">Elektro</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Getriebe</label>
              <select
                value={formData.transmission}
                onChange={(e) => setFormData({...formData, transmission: e.target.value})}
                style={styles.select}
              >
                <option value="manual">Schaltgetriebe</option>
                <option value="automatic">Automatik</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Sitzplätze</label>
              <input
                type="number"
                value={formData.seats}
                onChange={(e) => setFormData({...formData, seats: e.target.value})}
                style={styles.input}
                min="2"
                max="9"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Schlafplätze</label>
              <input
                type="number"
                value={formData.beds}
                onChange={(e) => setFormData({...formData, beds: e.target.value})}
                style={styles.input}
                min="2"
                max="9"
              />
            </div>
          </div>
        </div>

        {/* Ausstattung */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Ausstattung</h2>
          
          <div style={styles.equipmentInput}>
            <input
              type="text"
              value={equipmentInput}
              onChange={(e) => setEquipmentInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddEquipment())}
              style={styles.input}
              placeholder="z.B. Markise, Fahrradträger, Solaranlage..."
            />
            <button
              type="button"
              onClick={handleAddEquipment}
              style={styles.addEquipmentButton}
            >
              ➕ Hinzufügen
            </button>
          </div>

          <div style={styles.equipmentList}>
            {formData.equipment.map((item, index) => (
              <div key={index} style={styles.equipmentItem}>
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEquipment(index)}
                  style={styles.removeButton}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <label style={styles.label}>Besondere Features</label>
          <textarea
            value={formData.features}
            onChange={(e) => setFormData({...formData, features: e.target.value})}
            style={styles.textarea}
            rows="3"
            placeholder="Weitere besondere Ausstattungsmerkmale..."
          />
        </div>

        {/* Preise */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Preise & Kaution</h2>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Tagespreis (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.daily_rate_default}
                onChange={(e) => setFormData({...formData, daily_rate_default: e.target.value})}
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Wochenpreis (€)</label>
              <input
                type="number"
                step="0.01"
                value={formData.weekly_rate}
                onChange={(e) => setFormData({...formData, weekly_rate: e.target.value})}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Kaution (€)</label>
            <input
              type="number"
              step="0.01"
              value={formData.deposit_amount}
              onChange={(e) => setFormData({...formData, deposit_amount: e.target.value})}
              style={styles.input}
            />
          </div>
        </div>

        {/* Status & Notizen */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Status & Notizen</h2>

          <div style={styles.field}>
            <label style={styles.label}>Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              style={styles.select}
            >
              <option value="available">Verfügbar</option>
              <option value="rented">Vermietet</option>
              <option value="maintenance">Wartung</option>
              <option value="retired">Außer Betrieb</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Notizen</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              style={styles.textarea}
              rows="4"
              placeholder="Interne Notizen zum Fahrzeug..."
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonRow}>
          <button
            type="submit"
            disabled={loading}
            style={{...styles.submitButton, opacity: loading ? 0.5 : 1}}
          >
            {loading ? 'Speichere...' : id ? '✅ Aktualisieren' : '✅ Anlegen'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/vehicles')}
            style={styles.cancelButton}
          >
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f9fafb',
    minHeight: '100vh',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '30px',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '30px',
    borderBottom: '2px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '20px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '15px',
  },
  field: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
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
  equipmentInput: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  },
  addEquipmentButton: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  equipmentList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '20px',
  },
  equipmentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    backgroundColor: '#dbeafe',
    borderRadius: '6px',
    fontSize: '14px',
  },
  removeButton: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '0',
    fontWeight: 'bold',
  },
  buttonRow: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
  },
  submitButton: {
    flex: 1,
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  cancelButton: {
    flex: 1,
    padding: '16px',
    fontSize: '16px',
    fontWeight: '500',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  }
}