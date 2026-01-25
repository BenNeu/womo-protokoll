import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import StartPage from './pages/StartPage'
import ProtocolPage from './pages/ProtocolPage'
import AdminPage from './pages/AdminPage'
import RentalFormPage from './pages/RentalFormPage'
import CleaningProtocolPage from './pages/CleaningProtocolPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/protocol/:rentalId/:type" element={<ProtocolPage />} />
        <Route path="/cleaning/:rentalId" element={<CleaningProtocolPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/new" element={<RentalFormPage />} />
        <Route path="/admin/edit/:id" element={<RentalFormPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App