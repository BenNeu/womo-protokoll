import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createContract, updateContract, fetchContract, saveSignature } from '../../services/contractService'
import SignatureCanvas from 'react-signature-canvas'
import './ContractForm.css'

const ContractForm = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const sigCanvas = useRef(null)

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    customer_id_number: '',
    customer_drivers_license: '',
    vehicle_registration: '',
    rental_start_date: '',
    rental_end_date: '',
    rental_days: 0,
    daily_rate: 0,
    total_amount: 0,
    deposit_amount: 0,
    included_km: 0,
    extra_km_rate: 0,
    insurance_package: '',
    additional_driver: false,
    additional_driver_name: '',
    special_terms: ''
  })

  useEffect(() => {
    if (isEdit) {
      loadContract()
    }
  }, [id])

  const loadContract = async () => {
    try {
      const data = await fetchContract(id)
      setForm(data)
    } catch (err) {
      console.error('Error loading contract:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const calculateDays = () => {
    if (form.rental_start_date && form.rental_end_date) {
      const start = new Date(form.rental_start_date)
      const end = new Date(form.rental_end_date)
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      setForm(prev => ({
        ...prev,
        rental_days: days > 0 ? days : 0
      }))
      calculateTotal(days > 0 ? days : 0)
    }
  }

  const calculateTotal = (days = form.rental_days) => {
    setForm(prev => ({
      ...prev,
      total_amount: days * prev.daily_rate
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Prüfe ob Unterschrift vorhanden (nur bei neuem Vertrag)
    if (!isEdit && sigCanvas.current && sigCanvas.current.isEmpty()) {
      alert('Bitte unterschreiben Sie den Vertrag')
      return
    }
    
    try {
      setLoading(true)
      let savedContract
      
      if (isEdit) {
        savedContract = await updateContract(id, form)
      } else {
        savedContract = await createContract(form)
        
        // Unterschrift speichern (nur bei neuem Vertrag)
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
          const signatureData = sigCanvas.current.toDataURL()
          await saveSignature(
            savedContract.id, 
            'tenant', 
            form.customer_name, 
            signatureData
          )
          
          // Status auf "signed" setzen
          await updateContract(savedContract.id, { status: 'signed' })
        }
      }
      
      navigate('/contracts')
    } catch (err) {
      console.error('Error saving contract:', err)
      alert('Fehler beim Speichern des Vertrags')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contract-form">
      <h2>{isEdit ? 'Vertrag bearbeiten' : 'Neuer Mietvertrag'}</h2>

      <form onSubmit={handleSubmit}>
        {/* Kundendaten */}
        <fieldset>
          <legend>Kundendaten</legend>
          
          <div className="form-group">
            <label>Name *</label>
            <input 
              name="customer_name"
              value={form.customer_name}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input 
                name="customer_email"
                type="email"
                value={form.customer_email}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Telefon</label>
              <input 
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Adresse</label>
            <textarea 
              name="customer_address"
              value={form.customer_address}
              onChange={handleChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Ausweisnummer</label>
              <input 
                name="customer_id_number"
                value={form.customer_id_number}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Führerscheinnummer</label>
              <input 
                name="customer_drivers_license"
                value={form.customer_drivers_license}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Vertragsdaten */}
        <fieldset>
          <legend>Vertragsdaten</legend>
          
          <div className="form-group">
            <label>Fahrzeug *</label>
            <input 
              name="vehicle_registration"
              value={form.vehicle_registration}
              onChange={handleChange}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Mietbeginn *</label>
              <input 
                name="rental_start_date"
                type="date"
                value={form.rental_start_date}
                onChange={(e) => {
                  handleChange(e)
                  setTimeout(calculateDays, 0)
                }}
                required 
              />
            </div>
            <div className="form-group">
              <label>Mietende *</label>
              <input 
                name="rental_end_date"
                type="date"
                value={form.rental_end_date}
                onChange={(e) => {
                  handleChange(e)
                  setTimeout(calculateDays, 0)
                }}
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tagessatz (EUR)</label>
              <input 
                name="daily_rate"
                type="number"
                step="0.01"
                value={form.daily_rate}
                onChange={(e) => {
                  handleChange(e)
                  setTimeout(() => calculateTotal(), 0)
                }}
              />
            </div>
            <div className="form-group">
              <label>Anzahl Tage</label>
              <input 
                name="rental_days"
                type="number"
                value={form.rental_days}
                readOnly 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Gesamtbetrag (EUR)</label>
              <input 
                name="total_amount"
                type="number"
                step="0.01"
                value={form.total_amount}
                readOnly 
              />
            </div>
            <div className="form-group">
              <label>Kaution (EUR)</label>
              <input 
                name="deposit_amount"
                type="number"
                step="0.01"
                value={form.deposit_amount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Inkl. Kilometer</label>
              <input 
                name="included_km"
                type="number"
                value={form.included_km}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Mehrkilometer (EUR/km)</label>
              <input 
                name="extra_km_rate"
                type="number"
                step="0.01"
                value={form.extra_km_rate}
                onChange={handleChange}
              />
            </div>
          </div>
        </fieldset>

        {/* Zusatzoptionen */}
        <fieldset>
          <legend>Zusatzoptionen</legend>
          
          <div className="form-group">
            <label>Versicherungspaket</label>
            <select 
              name="insurance_package"
              value={form.insurance_package}
              onChange={handleChange}
            >
              <option value="">Keine Auswahl</option>
              <option value="basic">Basis</option>
              <option value="premium">Premium</option>
              <option value="full">Vollkasko</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input 
                name="additional_driver"
                type="checkbox"
                checked={form.additional_driver}
                onChange={handleChange}
              />
              Zusatzfahrer
            </label>
          </div>

          {form.additional_driver && (
            <div className="form-group">
              <label>Name Zusatzfahrer</label>
              <input 
                name="additional_driver_name"
                value={form.additional_driver_name}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="form-group">
            <label>Besondere Vereinbarungen</label>
            <textarea 
              name="special_terms"
              value={form.special_terms}
              onChange={handleChange}
              rows="4"
            />
          </div>
        </fieldset>

        {/* Unterschrift Mieter - nur bei neuem Vertrag */}
        {!isEdit && (
          <fieldset>
            <legend>Unterschrift Mieter</legend>
            
            <p style={{ marginBottom: '15px', color: '#666' }}>
              Bitte unterschreiben Sie hier mit der Maus oder dem Touchpad:
            </p>
            
            <div className="signature-pad-wrapper">
              <SignatureCanvas
                ref={sigCanvas}
                canvasProps={{
                  className: 'signature-pad'
                }}
              />
            </div>
            
            <button 
              type="button" 
              onClick={() => sigCanvas.current.clear()} 
              className="btn-secondary"
              style={{ marginTop: '10px' }}
            >
              Unterschrift löschen
            </button>
          </fieldset>
        )}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/contracts')} 
            className="btn-secondary"
          >
            Abbrechen
          </button>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
          >
            {loading ? 'Speichert...' : 'Speichern'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ContractForm