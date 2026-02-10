import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { generateContractPDF } from '../../services/contractPdfService'

export default function GenerateContractPdfPage() {
  const { contractId } = useParams()
  const [status, setStatus] = useState('processing')

  useEffect(() => {
    if (contractId) {
      handleGenerate()
    }
  }, [contractId])

  const handleGenerate = async () => {
    try {
      console.log('🔄 Generiere PDF für Vertrag:', contractId)
      
      await generateContractPDF(contractId)
      
      setStatus('success')
      console.log('✅ PDF erfolgreich generiert')

    } catch (error) {
      console.error('❌ Fehler beim PDF-Export:', error)
      setStatus('error')
    }
  }

  return (
    <div style={styles.container}>
      {status === 'processing' && (
        <>
          <div style={styles.spinner}>📄</div>
          <p style={styles.text}>Generiere PDF...</p>
          <p style={styles.small}>Vertrag-ID: {contractId}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div style={styles.success}>✅</div>
          <p style={styles.text}>PDF erfolgreich generiert!</p>
          <p style={styles.small}>Download sollte automatisch starten.</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div style={styles.error}>❌</div>
          <p style={styles.text}>Fehler beim Generieren des PDFs</p>
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
    marginBottom: '20px',
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
  }
}