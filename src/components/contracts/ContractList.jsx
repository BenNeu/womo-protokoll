import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchContracts } from '../../services/contractService'
import './ContractList.css'

const ContractList = () => {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const data = await fetchContracts()
      setContracts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status) => {
    const labels = {
      draft: 'Entwurf',
      pending_signature: 'Unterschrift ausstehend',
      signed: 'Unterschrieben',
      active: 'Aktiv',
      completed: 'Abgeschlossen',
      cancelled: 'Storniert'
    }
    return labels[status] || status
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('de-DE')
  }

  if (loading) return <div className="loading">Lädt...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="contract-list">
      <div className="header">
        <h2>Mietverträge</h2>
        <button 
          onClick={() => navigate('/contracts/new')} 
          className="btn-primary"
        >
          Neuer Vertrag
        </button>
      </div>

      <div className="contracts-grid">
        {contracts.map(contract => (
          <div 
            key={contract.id}
            className="contract-card"
            onClick={() => navigate(`/contracts/${contract.id}`)}
          >
            <div className="contract-header">
              <span className="contract-number">{contract.contract_number}</span>
              <span className={`status ${contract.status}`}>
                {getStatusLabel(contract.status)}
              </span>
            </div>
            
            <div className="contract-info">
              <h3>{contract.customer_name}</h3>
              <p>{contract.vehicle_registration}</p>
              <p className="dates">
                {formatDate(contract.rental_start_date)} - 
                {formatDate(contract.rental_end_date)}
              </p>
              <p className="amount">{contract.total_amount} EUR</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ContractList