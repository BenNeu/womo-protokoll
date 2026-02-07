import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function VehiclesPage() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehicles()
  }, [])

  const loadVehicles = async () => {
    const { data, error } = await supabase
      .from('OrcaCampers_vehicles')
      .select('*')
      .eq('is_active', true)
      .order('manufacturer', { ascending: true })

    if (error) {
      alert('Fehler: ' + error.message)
      return
    }

    setVehicles(data || [])
    setLoading(false)
  }

  const getStatusBadge = (status) => {
    const styles = {
      available: { bg: '#10b981', text: 'Verfügbar' },
      rented: { bg: '#f59e0b', text: 'Vermietet' },
      maintenance: { bg: '#ef4444', text: 'Wartung' },
      retired: { bg: '#6b7280', text: 'Außer Betrieb' }
    }
    const style = styles[status] || styles.available
    return (
      <span style={{
        backgroundColor: style.bg,
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    )
  }

  if (loading) return <div style={styles.loading}>Lade Fahrzeuge...</div>

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fahrzeugverwaltung</h1>
        <button 
          onClick={() => navigate('/vehicles/new')}
          style={styles.addButton}
        >
          ➕ Neues Fahrzeug
        </button>
      </div>

      <div style={styles.grid}>
        {vehicles.map(vehicle => (
          <div 
            key={vehicle.id} 
            style={styles.card}
            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
          >
            {vehicle.main_photo && (
              <img 
                src={vehicle.main_photo} 
                alt={`${vehicle.manufacturer} ${vehicle.model}`}
                style={styles.photo}
              />
            )}
            
            <div style={styles.cardContent}>
              <h3 style={styles.vehicleName}>
                {vehicle.manufacturer} {vehicle.model}
              </h3>
              
              <p style={styles.licensePlate}>
                🚗 {vehicle.license_plate}
              </p>
              
              <div style={styles.details}>
                <span>🛏️ {vehicle.beds} Betten</span>
                <span>👥 {vehicle.seats} Sitze</span>
                <span>📅 {vehicle.year}</span>
              </div>
              
              <div style={styles.priceRow}>
                <span style={styles.price}>{vehicle.daily_rate_default} €/Tag</span>
                {getStatusBadge(vehicle.status)}
              </div>
              
              {vehicle.equipment && (
                <div style={styles.equipment}>
                  {JSON.parse(vehicle.equipment).slice(0, 3).map((item, i) => (
                    <span key={i} style={styles.equipmentTag}>{item}</span>
                  ))}
                  {JSON.parse(vehicle.equipment).length > 3 && (
                    <span style={styles.equipmentTag}>+{JSON.parse(vehicle.equipment).length - 3}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {vehicles.length === 0 && (
        <div style={styles.empty}>
          <p>Noch keine Fahrzeuge angelegt.</p>
          <button 
            onClick={() => navigate('/vehicles/new')}
            style={styles.emptyButton}
          >
            Erstes Fahrzeug anlegen
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    }
  },
  photo: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  cardContent: {
    padding: '16px',
  },
  vehicleName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  licensePlate: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  details: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  priceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  price: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#10b981',
  },
  equipment: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  equipmentTag: {
    backgroundColor: '#e5e7eb',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#374151',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6b7280',
  },
  emptyButton: {
    marginTop: '20px',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6b7280',
  }
}