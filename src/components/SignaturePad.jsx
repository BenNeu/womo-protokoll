import { useRef, useState } from 'react'
import { supabase } from '../services/supabaseClient'

export default function SignaturePad({ onSave, label = "Unterschrift", bucket = 'protocol-photos', folder = 'signatures' }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [uploading, setUploading] = useState(false)

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasSignature(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.lineTo(x, y)
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => setIsDrawing(false)

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
    onSave(null)
  }

  const save = async () => {
    const canvas = canvasRef.current
    setUploading(true)

    try {
      // Canvas → Blob
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.png`

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: 'image/png', upsert: false })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      onSave(urlData.publicUrl)
      alert('✅ Unterschrift gespeichert')
    } catch (err) {
      alert('Upload fehlgeschlagen: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={styles.container}>
      <label style={styles.label}>{label}:</label>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        style={styles.canvas}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div style={styles.buttons}>
        <button onClick={clear} style={styles.clearButton}>🗑️ Löschen</button>
        <button
          onClick={save}
          disabled={!hasSignature || uploading}
          style={{
            ...styles.saveButton,
            opacity: (hasSignature && !uploading) ? 1 : 0.5,
            cursor: (hasSignature && !uploading) ? 'pointer' : 'not-allowed'
          }}
        >
          {uploading ? '⏳ Wird hochgeladen...' : '✅ Unterschrift bestätigen'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: { marginBottom: '25px' },
  label: {
    display: 'block', marginBottom: '10px',
    fontWeight: '600', color: '#374151', fontSize: '16px',
  },
  canvas: {
    border: '2px solid #e5e7eb', borderRadius: '8px',
    backgroundColor: 'white', cursor: 'crosshair',
    touchAction: 'none', width: '100%', maxWidth: '600px', display: 'block',
  },
  buttons: { display: 'flex', gap: '10px', marginTop: '10px' },
  clearButton: {
    padding: '10px 20px', fontSize: '14px', backgroundColor: '#ef4444',
    color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500',
  },
  saveButton: {
    padding: '10px 20px', fontSize: '14px', backgroundColor: '#10b981',
    color: 'white', border: 'none', borderRadius: '6px', fontWeight: '500',
  }
}