import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function AdminPage() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, completed
  const navigate = useNavigate()

  useEffect(() => {
    loadRentals()
  }, [filter])

  const loadRentals = async () => {
    setLoading(true)
    
    let query = supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter === 'active') {
      query = query.eq('status', 'active')
    } else if (filter === 'completed') {
      query = query.eq('status', 'completed')
    }

    const { data, error } = await query

    if (error) {
      console.error('Fehler beim Laden:', error)
      alert('Fehler beim Laden: ' + error.message)
    } else {
      setRentals(data || [])
    }
    
    setLoading(false)
  }

  const completeRental = async (id) => {
    if (!window.confirm('Mietvorgang als abgeschlossen markieren?')) return

    const { error } = await supabase
      .from('OrcaCampers_rentals')
      .update({ status: 'completed' })
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      alert('✅ Mietvorgang abgeschlossen!')
      loadRentals()
    }
  }

  const deleteRental = async (id) => {
    if (!window.confirm('Mietvorgang wirklich löschen? Dies kann nicht rückgängig gemacht werden!')) return

    const { error } = await supabase
      .from('OrcaCampers_rentals')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Fehler: ' + error.message)
    } else {
      alert('✅ Mietvorgang gelöscht!')
      loadRentals()
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
        <h1 style={styles.title}>Verwaltung</h1>
      </div>

      <div style={styles.actions}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Zurück zur Startseite
        </button>
        <button onClick={() => navigate('/admin/new')} style={styles.newButton}>
          + Neuer Mietvorgang
        </button>
      </div>

      <div style={styles.filters}>
        <button 
          onClick={() => setFilter('all')}
          style={{...styles.filterButton, ...(filter === 'all' ? styles.filterButtonActive : {})}}
        >
          Alle ({rentals.length})
        </button>
        <button 
          onClick={() => setFilter('active')}
          style={{...styles.filterButton, ...(filter === 'active' ? styles.filterButtonActive : {})}}
        >
          Aktiv
        </button>
        <button 
          onClick={() => setFilter('completed')}
          style={{...styles.filterButton, ...(filter === 'completed' ? styles.filterButtonActive : {})}}
        >
          Abgeschlossen
        </button>
      </div>

      <div style={styles.list}>
        {rentals.length === 0 ? (
          <div style={styles.empty}>
            <p>Keine Mietvorgänge gefunden.</p>
            <button onClick={() => navigate('/admin/new')} style={styles.newButton}>
              + Ersten Mietvorgang anlegen
            </button>
          </div>
        ) : (
          rentals.map(rental => (
            <div key={rental.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.cardTitle}>{rental.rental_number}</h3>
                  <span style={{
                    ...styles.badge,
                    backgroundColor: rental.status === 'active' ? '#10b981' : '#6b7280'
                  }}>
                    {rental.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                  </span>
                </div>
              </div>

              <div style={styles.cardBody}>
                <p><strong>Kunde:</strong> {rental.customer_name}</p>
                <p><strong>Fahrzeug:</strong> {rental.vehicle_manufacturer} {rental.vehicle_model} ({rental.vehicle_license_plate})</p>
                <p><strong>Zeitraum:</strong> {new Date(rental.start_date).toLocaleDateString()} - {new Date(rental.end_date).toLocaleDateString()}</p>
                {rental.customer_email && <p><strong>Email:</strong> {rental.customer_email}</p>}
                {rental.customer_phone && <p><strong>Telefon:</strong> {rental.customer_phone}</p>}
              </div>

              <div style={styles.cardActions}>
                <button 
                  onClick={() => navigate(`/admin/edit/${rental.id}`)} 
                  style={styles.editButton}
                >
                  ✏️ Bearbeiten
                </button>
                
                {rental.status === 'active' && (
                  <button 
                    onClick={() => completeRental(rental.id)} 
                    style={styles.completeButton}
                  >
                    ✅ Abschließen
                  </button>
                )}

                <button 
                  onClick={() => deleteRental(rental.id)} 
                  style={styles.deleteButton}
                >
                  🗑️ Löschen
                </button>
              </div>
            </div>
          ))
        )}
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
  actions: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  backButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  newButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  filters: {
    maxWidth: '1200px',
    margin: '0 auto 20px',
    display: 'flex',
    gap: '10px',
  },
  filterButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: 'white',
    color: '#374151',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  filterButtonActive: {
    backgroundColor: '#10b981',
    color: 'white',
    borderColor: '#10b981',
  },
  list: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gap: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  cardBody: {
    marginBottom: '15px',
    lineHeight: '1.6',
  },
  cardActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  editButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  completeButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '12px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#6b7280',
  },
}