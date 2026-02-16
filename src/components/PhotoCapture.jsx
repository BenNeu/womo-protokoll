import { useRef, useState } from 'react'

export default function PhotoCapture({ onCapture }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handleCapture = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target.result
      setPreview(imageData)
      onCapture(imageData)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={styles.container}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        style={{ display: 'none' }}
      />

      {preview ? (
        <div>
          <img src={preview} alt="Aufgenommenes Foto" style={styles.preview} />
          <button 
            onClick={() => {
              setPreview(null)
              inputRef.current.value = ''
              inputRef.current.click()
            }} 
            style={styles.retakeButton}
          >
            🔄 Neu aufnehmen
          </button>
        </div>
      ) : (
        <button onClick={() => inputRef.current.click()} style={styles.button}>
          📷 Foto aufnehmen
        </button>
      )}
    </div>
  )
}

const styles = {
  container: {
    marginBottom: '20px',
  },
  button: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  preview: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover',
    borderRadius: '8px',
    marginBottom: '10px',
  },
  retakeButton: {
    padding: '10px 20px',
    fontSize: '14px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
  },
}