import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import StartPage from './pages/StartPage'
import ProtocolPage from './pages/ProtocolPage'
import AdminPage from './pages/AdminPage'
import RentalFormPage from './pages/RentalFormPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <StartPage />
            </ProtectedRoute>
          } />
          
          <Route path="/protocol/:rentalId/:type" element={
            <ProtectedRoute>
              <ProtocolPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/new" element={
            <ProtectedRoute>
              <RentalFormPage />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/edit/:id" element={
            <ProtectedRoute>
              <RentalFormPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App