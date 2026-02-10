import { useEffect, useState } from 'react'
import { autoCreateContractFromBooking } from '../../services/autoContractService'

export default function TriggerContractPage() {
  const [status, setStatus] = useState('processing')
  const [contractData, setContractData] = useState(null)

  useEffect(() => {
    handleTrigger()
  }, [])

  const handleTrigger = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const rentalId = urlParams.get('rental_id')

      if (!rentalId) {
        setStatus('error')
        console.error('Fehler: rental_id fehlt')
        return
      }

      console.log('🔄 Erstelle Vertrag für Rental:', rentalId)

      const contract = await autoCreateContractFromBooking(rentalId)
      
      setStatus('success')
      setContractData(contract)
      
      console.log('✅ Vertrag erstellt:', contract.contract_number)

    } catch (error) {
      console.error('❌ Fehler:', error)
      setStatus('error')
    }
  }

  return (
    <div style={styles.container}>
      {status === 'processing' && (
        <>
          <div style={styles.spinner}>⏳</div>
          <p style={styles.text}>Erstelle Vertrag...</p>
        </>
      )}

      {status === 'success' && contractData && (
        <>
          <div style={styles.success}>✅</div>
          <p style={styles.text}>Vertrag erfolgreich erstellt!</p>
          <p style={styles.small}>
            Vertragsnummer: {contractData.contract_number}<br/>
            ID: {contractData.id}
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={styles.error}>❌</div>
          <p style={styles.text}>Fehler beim Erstellen des Vertrags</p>
        </>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px',
  },
  spinner: {
    fontSize: '60px',
  },
  success: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  error: {
    fontSize: '80px',
    marginBottom: '20px',
  },
  text: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginTop: '10px',
  },
  small: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '10px',
    textAlign: 'center',
  }
}