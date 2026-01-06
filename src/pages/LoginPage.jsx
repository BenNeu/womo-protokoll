cd ~/Desktop/womo-protokoll
cat > src/pages/LoginPage.jsx << 'EOF'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password)
        alert('✅ Account erstellt! Bitte bestätige deine E-Mail.')
        setIsSignUp(false)
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (error) {
      alert('Fehler: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <img src="/logo.png" alt="Logo" style={styles.logo} />
        <h1 style={styles.title}>
          {isSignUp ? 'Registrieren' : 'Anmelden'}
        </h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>E-Mail:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Passwort:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Lädt...' : isSignUp ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={styles.toggleButton}
        >
          {isSignUp ? 'Bereits registriert? Anmelden' : 'Noch kein Account? Registrieren'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: '20px',
  },
  loginBox: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    width: '100%',
  },
  logo: {
    maxWidth: '150px',
    height: 'auto',
    display: 'block',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '30px',
  },
  form: {
    marginBottom: '20px',
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#374151',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
  },
  toggleButton: {
    width: '100%',
    padding: '10px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#3b82f6',
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
}
EOF