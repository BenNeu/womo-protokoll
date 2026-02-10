import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StartPage from './pages/StartPage'
import ProtocolPage from './pages/ProtocolPage'
import AdminPage from './pages/AdminPage'
import RentalFormPage from './pages/RentalFormPage'
import CleaningProtocolPage from './pages/CleaningProtocolPage'
import ContractsPage from './pages/contracts/ContractsPage'
import ContractFormPage from './pages/contracts/ContractFormPage'
import ContractDetailPage from './pages/contracts/ContractDetailPage'
import VehiclesPage from './pages/VehiclesPage'
import VehicleFormPage from './pages/VehicleFormPage'
import TriggerContractPage from './pages/api/TriggerContractPage'
import GenerateContractPdfPage from './pages/api/GenerateContractPdfPage'
import { syncConfirmedBookings } from './services/autoContractService'

function App() {
  useEffect(() => {
    console.log('🚀 App gestartet - Synchronisiere bestätigte Buchungen...')
    syncConfirmedBookings().catch(error => {
      console.error('Fehler bei Auto-Sync:', error)
    })
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/protocol/:rentalId/:type" element={<ProtocolPage />} />
        <Route path="/cleaning/:rentalId" element={<CleaningProtocolPage />} />
        
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/new" element={<RentalFormPage />} />
        <Route path="/admin/edit/:id" element={<RentalFormPage />} />
        
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/contracts/new" element={<ContractFormPage />} />
        <Route path="/contracts/:id" element={<ContractDetailPage />} />
        <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
        
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/new" element={<VehicleFormPage />} />
        <Route path="/vehicles/:id/edit" element={<VehicleFormPage />} />
        
        <Route path="/api/trigger-contract" element={<TriggerContractPage />} />
        <Route path="/api/contracts/:contractId/pdf" element={<GenerateContractPdfPage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App