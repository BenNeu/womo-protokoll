import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import ProtocolPage from './pages/ProtocolPage'
import AdminPage from './pages/AdminPage'
import RentalFormPage from './pages/RentalFormPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/protocol/:rentalId/:type" element={<ProtocolPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/new" element={<RentalFormPage />} />
        <Route path="/admin/edit/:id" element={<RentalFormPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App