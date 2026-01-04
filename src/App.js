import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import ProtocolPage from './pages/ProtocolPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/protocol/:rentalId/:type" element={<ProtocolPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App