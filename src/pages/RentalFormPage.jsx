import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function RentalFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [loading, setLoading] = useState(isEdit)

  const [formData, setFormData] = useState({
    rental_number: '',
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_license_number: '',
    start_date: '',
    end_date: '',
    vehicle_manufacturer: '',
    vehicle_model: '',
    vehicle_license_plate: '',
    vehicle_type: '',
    vehicle_seats: '',
    vehicle_beds: '',
    status: 'active'
  })

  useEffect(() => {
    if (isEdit) {
      loadRental()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadRental = async () => {
    const { data, error } = await supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      alert('Fehler beim Laden: ' + error.message)
      navigate('/admin')
    } else {
      // Datum formatieren für date-input (YYYY-MM-DD)
      const formatDate = (dateString) => {
        if (!dateString) return ''
        return dateString.split(' ')[0] // "2026-02-10 14:00:00" → "2026-02-10"
      }
      
      setFormData({
        ...data,
        start_date: formatDate(data.start_date),
        end_date: formatDate(data.end_date)
      })
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validierung
    if (!formData.rental_number || !formData.customer_name || !formData.start_date || !formData.end_date) {
      alert('Bitte fülle alle Pflichtfelder aus!')
      return
    }

    try {
      if (isEdit) {
        // Update
        const { error } = await supabase
          .from('OrcaCampers_rentals')
          .update(formData)
          .eq('id', id)

        if (error) throw error
        alert('✅ Mietvorgang aktualisiert!')
      } else {
        // Insert
        const { error } = await supabase
          .from('OrcaCampers_rentals')
          .insert(formData)

        if (error) throw error
        alert('✅ Mietvorgang angelegt!')
      }

      navigate('/admin')
    } catch (err) {
      console.error('Fehler:', err)
      alert('Fehler beim Speichern: ' + err.message)
    }
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
        <h1 style={styles.title}>
          {isEdit ? 'Mietvorgang bearbeiten' : 'Neuer Mietvorgang'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Mietvorgang</h2>

          <div style={styles.field}>
            <label style={styles.label}>Mietvertragsnummer: *</label>
            <input
              type="text"
              value={formData.rental_number}
              onChange={(e) => setFormData({...formData, rental_number: e.target.value})}
              placeholder="z.B. WM-2026-001"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Mietbeginn: *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Mietende: *</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Status:</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              style={styles.select}
            >
              <option value="active">Aktiv</option>
              <option value="completed">Abgeschlossen</option>
              <option value="confirmed">Bestätigt</option>
              <option value="pending">Ausstehend</option>
            </select>
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Kunde</h2>

          <div style={styles.field}>
            <label style={styles.label}>Name: *</label>
            <input
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
              placeholder="Max Mustermann"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>E-Mail:</label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({...formData, customer_email: e.target.value})}
              placeholder="max@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Telefon:</label>
            <input
              type="tel"
              value={formData.customer_phone}
              onChange={(e) => setFormData({...formData, customer_phone: e.target.value})}
              placeholder="+49 170 1234567"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Adresse:</label>
            <input
              type="text"
              value={formData.customer_address}
              onChange={(e) => setFormData({...formData, customer_address: e.target.value})}
              placeholder="Musterstraße 123, 12345 Stadt"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Führerscheinnummer:</label>
            <input
              type="text"
              value={formData.customer_license_number}
              onChange={(e) => setFormData({...formData, customer_license_number: e.target.value})}
              placeholder="B123456789"
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Fahrzeug</h2>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Hersteller:</label>
              <input
                type="text"
                value={formData.vehicle_manufacturer}
                onChange={(e) => setFormData({...formData, vehicle_manufacturer: e.target.value})}
                placeholder="z.B. Fiat"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Modell:</label>
              <input
                type="text"
                value={formData.vehicle_model}
                onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                placeholder="z.B. Ducato Camper"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Kennzeichen:</label>
            <input
              type="text"
              value={formData.vehicle_license_plate}
              onChange={(e) => setFormData({...formData, vehicle_license_plate: e.target.value})}
              placeholder="z.B. WÜ-AB-123"
              style={styles.input}
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Fahrzeugtyp:</label>
              <input
                type="text"
                value={formData.vehicle_type}
                onChange={(e) => setFormData({...formData, vehicle_type: e.target.value})}
                placeholder="z.B. Kastenwagen"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Sitzplätze:</label>
              <input
                type="number"
                value={formData.vehicle_seats}
                onChange={(e) => setFormData({...formData, vehicle_seats: e.target.value})}
                placeholder="4"
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Schlafplätze:</label>
              <input
                type="number"
                value={formData.vehicle_beds}
                onChange={(e) => setFormData({...formData, vehicle_beds: e.target.value})}
                placeholder="2"
                style={styles.input}
              />
            </div>
          </div>
        </div>

        <div style={styles.actions}>
          <button type="button" onClick={() => navigate('/admin')} style={styles.cancelButton}>
            Abbrechen
          </button>
          <button type="submit" style={styles.submitButton}>
            {isEdit ? '✅ Speichern' : '✅ Anlegen'}
          </button>
        </div>
      </form>
    </div>
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
    margin: '0',
  },
  form: {
    maxWidth: '800px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '15px',
    paddingBottom: '8px',
    borderBottom: '2px solid #e5e7eb',
  },
  field: {
    marginBottom: '20px',
    flex: 1,
  },
  fieldRow: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
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
  actions: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    fontSize: '16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    padding: '14px',
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