import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useNavigate } from 'react-router-dom'

export default function StartPage() {
  const [rentals, setRentals] = useState([])
  const [selectedRental, setSelectedRental] = useState('')
  const [protocolType, setProtocolType] = useState('handover')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadRentals()
  }, [])

  const loadRentals = async () => {
    const { data, error } = await supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Fehler beim Laden:', error)
      alert('Fehler beim Laden der Mietvorgänge: ' + error.message)
      setLoading(false)
      return
    }
    
    setRentals(data || [])
    setLoading(false)
  }

  const startProtocol = () => {
    if (!selectedRental) {
      alert('Bitte wähle einen Mietvorgang aus')
      return
    }
    navigate(`/protocol/${selectedRental}/${protocolType}`)
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
        <div style={styles.logoContainer}>
          <img src="/logo.png" alt="Firmenlogo" style={styles.logo} />
          <h1 style={styles.title}>Wohnmobil-Übergabeprotokoll</h1>
        </div>
        <p style={styles.subtitle}>Digitales Protokoll für Abholung und Rückgabe</p>
      </div>

      <div style={styles.adminButton}>
        <button onClick={() => navigate('/admin')} style={styles.adminButtonStyle}>
          ⚙️ Verwaltung
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.section}>
          <label style={styles.label}>Mietvorgang auswählen:</label>
          <select 
            value={selectedRental}
            onChange={(e) => setSelectedRental(e.target.value)}
            style={styles.select}
          >
            <option value="">-- Bitte wählen --</option>
            {rentals.map(rental => (
              <option key={rental.id} value={rental.id}>
                {rental.rental_number} - {rental.customer_name} 
                ({rental.vehicle_manufacturer} {rental.vehicle_model})
              </option>
            ))}
          </select>
          
          {rentals.length === 0 && (
            <p style={styles.emptyState}>
              Keine aktiven Mietvorgänge gefunden. 
              Erstelle zuerst einen Mietvorgang in der Verwaltung.
            </p>
          )}
        </div>

        <div style={styles.section}>
          <label style={styles.label}>Art des Protokolls:</label>
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input 
                type="radio" 
                value="handover"
                checked={protocolType === 'handover'}
                onChange={(e) => setProtocolType(e.target.value)}
                style={styles.radio}
              />
              <span style={styles.radioText}>📤 Übergabe an Mieter (Abholung)</span>
            </label>
            <label style={styles.radioLabel}>
              <input 
                type="radio" 
                value="return"
                checked={protocolType === 'return'}
                onChange={(e) => setProtocolType(e.target.value)}
                style={styles.radio}
              />
              <span style={styles.radioText}>📥 Rückgabe an Vermieter</span>
            </label>
          </div>
        </div>

        <button 
          onClick={startProtocol}
          disabled={!selectedRental}
          style={{
            ...styles.button,
            opacity: selectedRental ? 1 : 0.5,
            cursor: selectedRental ? 'pointer' : 'not-allowed'
          }}
        >
          Protokoll starten →
        </button>
      </div>
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
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  logo: {
    maxWidth: '200px',
    height: 'auto',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '10px 0 0 0',
  },
  adminButton: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  adminButtonStyle: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  section: {
    marginBottom: '25px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '16px',
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
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  radio: {
    marginRight: '10px',
    cursor: 'pointer',
  },
  radioText: {
    fontSize: '16px',
    color: '#374151',
  },
  button: {
    width: '100%',
    padding: '16px',
    fontSize: '18px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6b7280',
  },
  emptyState: {
    marginTop: '10px',
    padding: '15px',
    backgroundColor: '#fef3c7',
    borderRadius: '6px',
    color: '#92400e',
    fontSize: '14px',
  }
}