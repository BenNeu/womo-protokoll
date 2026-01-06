import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

export default function AdminPage() {
  const [rentals, setRentals] = useState([])
  const [filteredRentals, setFilteredRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all') // all, active, completed
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' })
  const navigate = useNavigate()

  useEffect(() => {
    loadRentals()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [rentals, statusFilter, searchTerm, dateFilter])

  const loadRentals = async () => {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('OrcaCampers_rentals')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fehler beim Laden:', error)
      alert('Fehler beim Laden: ' + error.message)
    } else {
      setRentals(data || [])
    }
    
    setLoading(false)
  }

  const applyFilters = () => {
    let filtered = [...rentals]

    // Status Filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(r => r.status === 'active')
    } else if (statusFilter === 'completed') {
      filtered = filtered.filter(r => r.status === 'completed')
    }

    // Suchbegriff Filter (Kunde, Fahrzeug, Vertragsnummer)
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(r => 
        r.customer_name?.toLowerCase().includes(search) ||
        r.rental_number?.toLowerCase().includes(search) ||
        r.vehicle_manufacturer?.toLowerCase().includes(search) ||
        r.vehicle_model?.toLowerCase().includes(search) ||
        r.vehicle_license_plate?.toLowerCase().includes(search) ||
        r.customer_email?.toLowerCase().includes(search) ||
        r.customer_phone?.toLowerCase().includes(search)
      )
    }

    // Datums-Filter
    if (dateFilter.start) {
      filtered = filtered.filter(r => {
        const startDate = new Date(r.start_date)
        const filterDate = new Date(dateFilter.start)
        return startDate >= filterDate
      })
    }
    if (dateFilter.end) {
      filtered = filtered.filter(r => {
        const endDate = new Date(r.end_date)
        const filterDate = new Date(dateFilter.end)
        return endDate <= filterDate
      })
    }

    setFilteredRentals(filtered)
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setSearchTerm('')
    setDateFilter({ start: '', end: '' })
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

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <h3 style={styles.filterTitle}>Filter & Suche</h3>
        
        {/* Suche */}
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="🔍 Suche nach Kunde, Fahrzeug, Vertragsnummer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={styles.clearButton}>
              ✕
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div style={styles.filters}>
          <button 
            onClick={() => setStatusFilter('all')}
            style={{...styles.filterButton, ...(statusFilter === 'all' ? styles.filterButtonActive : {})}}
          >
            Alle ({rentals.length})
          </button>
          <button 
            onClick={() => setStatusFilter('active')}
            style={{...styles.filterButton, ...(statusFilter === 'active' ? styles.filterButtonActive : {})}}
          >
            Aktiv ({rentals.filter(r => r.status === 'active').length})
          </button>
          <button 
            onClick={() => setStatusFilter('completed')}
            style={{...styles.filterButton, ...(statusFilter === 'completed' ? styles.filterButtonActive : {})}}
          >
            Abgeschlossen ({rentals.filter(r => r.status === 'completed').length})
          </button>
        </div>

        {/* Datums-Filter */}
        <div style={styles.dateFilter}>
          <div style={styles.dateField}>
            <label style={styles.dateLabel}>Mietbeginn ab:</label>
            <input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
              style={styles.dateInput}
            />
          </div>
          <div style={styles.dateField}>
            <label style={styles.dateLabel}>Mietende bis:</label>
            <input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
              style={styles.dateInput}
            />
          </div>
          <button onClick={resetFilters} style={styles.resetButton}>
            🔄 Filter zurücksetzen
          </button>
        </div>

        {/* Ergebnis-Anzeige */}
        <div style={styles.resultCount}>
          {filteredRentals.length} von {rentals.length} Mietvorgänge{filteredRentals.length !== rentals.length ? ' (gefiltert)' : ''}
        </div>
      </div>

      <div style={styles.list}>
        {filteredRentals.length === 0 ? (
          <div style={styles.empty}>
            <p>
              {rentals.length === 0 
                ? 'Keine Mietvorgänge gefunden.' 
                : 'Keine Mietvorgänge entsprechen den Filterkriterien.'}
            </p>
            {rentals.length === 0 ? (
              <button onClick={() => navigate('/admin/new')} style={styles.newButton}>
                + Ersten Mietvorgang anlegen
              </button>
            ) : (
              <button onClick={resetFilters} style={styles.resetButton}>
                Filter zurücksetzen
              </button>
            )}
          </div>
        ) : (
          filteredRentals.map(rental => (
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
                <p><strong>Zeitraum:</strong> {new Date(rental.start_date).toLocaleDateString('de-DE')} - {new Date(rental.end_date).toLocaleDateString('de-DE')}</p>
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
  filterSection: {
    maxWidth: '1200px',
    margin: '0 auto 25px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  filterTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '15px',
  },
  searchBox: {
    position: 'relative',
    marginBottom: '15px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  clearButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '4px 8px',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: '#6b7280',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
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
  dateFilter: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  dateField: {
    flex: 1,
    minWidth: '200px',
  },
  dateLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
  },
  dateInput: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  resetButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  resultCount: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
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