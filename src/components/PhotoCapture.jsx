import { useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function PhotoCapture({ onCapture, bucket = 'protocol-photos', folder = 'vehicle' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleCapture = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Preview sofort anzeigen
    const reader = new FileReader()
    reader.onload = (event) => setPreview(event.target.result)
    reader.readAsDataURL(file)

    // Upload zu Supabase Storage
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onCapture(urlData.publicUrl)
    } catch (err) {
      alert('Foto-Upload fehlgeschlagen: ' + err.message)
      setPreview(null)
    } finally {
      setUploading(false)
    }
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
          {uploading && <p style={styles.uploading}>⏳ Wird hochgeladen...</p>}
          {!uploading && (
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
          )}
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
  container: { marginBottom: '20px' },
  button: {
    padding: '12px 24px', fontSize: '16px',
    backgroundColor: '#3b82f6', color: 'white',
    border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '600',
  },
  preview: {
    width: '100%', maxHeight: '300px',
    objectFit: 'cover', borderRadius: '8px', marginBottom: '10px',
  },
  retakeButton: {
    padding: '10px 20px', fontSize: '14px',
    backgroundColor: '#6b7280', color: 'white',
    border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontWeight: '500',
  },
  uploading: {
    fontSize: '14px', color: '#f59e0b',
    fontWeight: '600', margin: '8px 0',
  },
}