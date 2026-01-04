import { useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function PhotoCapture({ onPhotoAdded, protocolId, label = "Foto aufnehmen" }) {
  const [uploading, setUploading] = useState(false)

  const handleCapture = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    try {
      // Dateiname mit Timestamp
      const fileExt = file.name.split('.').pop()
      const fileName = `${protocolId}/${Date.now()}.${fileExt}`

      // Upload zu Supabase Storage
      const { data, error } = await supabase.storage
        .from('protocol-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Public URL holen
      const { data: { publicUrl } } = supabase.storage
        .from('protocol-photos')
        .getPublicUrl(fileName)

      onPhotoAdded(publicUrl)
      
      // Input zurücksetzen für weitere Uploads
      e.target.value = ''
      
    } catch (error) {
      console.error('Upload-Fehler:', error)
      alert('Fehler beim Hochladen: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={styles.container}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        disabled={uploading}
        style={styles.input}
        id={`photo-input-${protocolId}`}
      />
      <label 
        htmlFor={`photo-input-${protocolId}`}
        style={{
          ...styles.button,
          opacity: uploading ? 0.6 : 1,
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? '⏳ Uploading...' : `📷 ${label}`}
      </label>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: '15px',
  },
  input: {
    display: 'none',
  },
  button: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    textAlign: 'center',
    transition: 'background-color 0.2s',
  }
}