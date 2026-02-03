import React, { useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { saveSignature } from '../../services/contractService'
import './ContractSignature.css'

const ContractSignature = ({ contractId, onSignatureComplete }) => {
  const landlordSigRef = useRef(null)
  const tenantSigRef = useRef(null)
  const [landlordName, setLandlordName] = useState('')
  const [tenantName, setTenantName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearLandlord = () => {
    landlordSigRef.current.clear()
  }

  const clearTenant = () => {
    tenantSigRef.current.clear()
  }

  const handleSaveLandlord = async () => {
    if (landlordSigRef.current.isEmpty()) {
      alert('Bitte unterschreiben Sie zuerst')
      return
    }
    if (!landlordName.trim()) {
      alert('Bitte Namen eingeben')
      return
    }

    try {
      setLoading(true)
      const signatureData = landlordSigRef.current.toDataURL()
      await saveSignature(contractId, 'landlord', landlordName, signatureData)
      alert('Unterschrift Vermieter gespeichert!')
      if (onSignatureComplete) onSignatureComplete()
    } catch (err) {
      setError(err.message)
      alert('Fehler beim Speichern: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTenant = async () => {
    if (tenantSigRef.current.isEmpty()) {
      alert('Bitte unterschreiben Sie zuerst')
      return
    }
    if (!tenantName.trim()) {
      alert('Bitte Namen eingeben')
      return
    }

    try {
      setLoading(true)
      const signatureData = tenantSigRef.current.toDataURL()
      await saveSignature(contractId, 'tenant', tenantName, signatureData)
      alert('Unterschrift Mieter gespeichert!')
      if (onSignatureComplete) onSignatureComplete()
    } catch (err) {
      setError(err.message)
      alert('Fehler beim Speichern: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contract-signature">
      <h2>Vertragsunterzeichnung</h2>

      <div className="signature-container">
        {/* Vermieter Unterschrift */}
        <div className="signature-box">
          <h3>Unterschrift Vermieter</h3>
          <div className="signature-input">
            <input
              type="text"
              placeholder="Name des Vermieters"
              value={landlordName}
              onChange={(e) => setLandlordName(e.target.value)}
            />
          </div>
          <div className="signature-pad-wrapper">
            <SignatureCanvas
              ref={landlordSigRef}
              canvasProps={{
                className: 'signature-pad'
              }}
            />
          </div>
          <div className="signature-actions">
            <button onClick={clearLandlord} className="btn-secondary">
              Löschen
            </button>
            <button 
              onClick={handleSaveLandlord} 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>

        {/* Mieter Unterschrift */}
        <div className="signature-box">
          <h3>Unterschrift Mieter</h3>
          <div className="signature-input">
            <input
              type="text"
              placeholder="Name des Mieters"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
            />
          </div>
          <div className="signature-pad-wrapper">
            <SignatureCanvas
              ref={tenantSigRef}
              canvasProps={{
                className: 'signature-pad'
              }}
            />
          </div>
          <div className="signature-actions">
            <button onClick={clearTenant} className="btn-secondary">
              Löschen
            </button>
            <button 
              onClick={handleSaveTenant} 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Speichert...' : 'Speichern'}
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default ContractSignature