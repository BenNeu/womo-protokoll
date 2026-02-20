import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fetchContract } from '../../services/contractService'
import { generateContractPDF } from '../../services/contractPdfService'
import ContractSignature from '../../components/contracts/ContractSignature'
import './ContractDetailPage.css'
import { generateContractPDF, uploadContractPDF } from '../../services/contractPdfService'

const ContractDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showSignature, setShowSignature] = useState(false)

  useEffect(() => {
    loadContract()
  }, [id])

  const loadContract = async () => {
    try {
      setLoading(true)
      const data = await fetchContract(id)
      setContract(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-DE')
  }

 const handleSignatureComplete = async () => {
  await loadContract()
  // Nach Unterschrift automatisch PDF hochladen
  try {
    await uploadContractPDF(id)
    console.log('✅ Vertrags-PDF automatisch gespeichert')
  } catch (err) {
    console.error('PDF Upload fehlgeschlagen:', err)
  }
}

const handleDownloadPDF = async () => {
  try {
    setLoading(true)
    await generateContractPDF(id)
  } catch (err) {
    alert('Fehler beim PDF-Export: ' + err.message)
  } finally {
    setLoading(false)
  }
}

  if (loading) return <div className="loading">Lädt...</div>
  if (error) return <div className="error">{error}</div>
  if (!contract) return <div>Vertrag nicht gefunden</div>

  return (
    <div className="contract-detail-page">
      <h1>Vertrag: {contract.contract_number}</h1>
      
      <div className="status-badge">
        Status: <span className={`status ${contract.status}`}>
          {contract.status === 'draft' ? 'Entwurf' : 
           contract.status === 'signed' ? 'Unterschrieben' : 
           contract.status}
        </span>
      </div>
      
      <div className="detail-grid">
        <div className="detail-section">
          <h3>Kunde</h3>
          <p><strong>Name:</strong> {contract.customer_name}</p>
          <p><strong>Email:</strong> {contract.customer_email}</p>
          <p><strong>Telefon:</strong> {contract.customer_phone}</p>
          <p><strong>Adresse:</strong> {contract.customer_address}</p>
          <p><strong>Ausweis:</strong> {contract.customer_id_number}</p>
          <p><strong>Führerschein:</strong> {contract.customer_drivers_license}</p>
        </div>
        
        <div className="detail-section">
          <h3>Vertragsdaten</h3>
          <p><strong>Fahrzeug:</strong> {contract.vehicle_registration}</p>
          <p><strong>Von:</strong> {formatDate(contract.rental_start_date)}</p>
          <p><strong>Bis:</strong> {formatDate(contract.rental_end_date)}</p>
          <p><strong>Tage:</strong> {contract.rental_days}</p>
          <p><strong>Tagessatz:</strong> {contract.daily_rate} EUR</p>
          <p><strong>Gesamtbetrag:</strong> {contract.total_amount} EUR</p>
          <p><strong>Kaution:</strong> {contract.deposit_amount} EUR</p>
          <p><strong>Inkl. KM:</strong> {contract.included_km} km</p>
          <p><strong>Mehrkilometer:</strong> {contract.extra_km_rate} EUR/km</p>
        </div>
      </div>

      {contract.insurance_package && (
        <div className="detail-section">
          <h3>Zusatzoptionen</h3>
          <p><strong>Versicherung:</strong> {contract.insurance_package}</p>
          {contract.additional_driver && (
            <p><strong>Zusatzfahrer:</strong> {contract.additional_driver_name}</p>
          )}
        </div>
      )}

      {contract.special_terms && (
        <div className="detail-section">
          <h3>Besondere Vereinbarungen</h3>
          <p>{contract.special_terms}</p>
        </div>
      )}

      <div className="actions">
        <button onClick={() => navigate('/contracts')} className="btn-secondary">
          Zurück zur Liste
        </button>
        <button onClick={() => navigate(`/contracts/${id}/edit`)} className="btn-secondary">
          Bearbeiten
        </button>
        {contract.status === 'signed' && (
          <button onClick={handleDownloadPDF} className="btn-pdf" disabled={loading}>
            📄 PDF herunterladen
          </button>
        )}
        <button 
          onClick={() => setShowSignature(!showSignature)} 
          className="btn-primary"
        >
          {showSignature ? 'Unterschriften ausblenden' : 'Vertrag unterschreiben'}
        </button>
      </div>

      {showSignature && (
        <div className="signature-section">
          <ContractSignature 
            contractId={id} 
            onSignatureComplete={handleSignatureComplete}
          />
        </div>
      )}
    </div>
  )
}

export default ContractDetailPage