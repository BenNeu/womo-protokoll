import { useRef, useState, useEffect } from 'react'

export default function PhotoCapture({ onCapture }) {
  const videoRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [pendingStream, setPendingStream] = useState(null)

  // Stream zuweisen sobald Video-Element im DOM ist
  useEffect(() => {
    if (isCameraActive && videoRef.current && pendingStream) {
      videoRef.current.srcObject = pendingStream
      setPendingStream(null)
    }
  }, [isCameraActive, pendingStream])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      setPendingStream(mediaStream)
      setIsCameraActive(true)
    } catch (err) {
      alert('Kamera-Zugriff fehlgeschlagen: ' + err.message)
    }
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg', 0.8)
    onCapture(imageData)
    stopCamera()
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
      setIsCameraActive(false)
    }
  }

  return (
    <div style={styles.container}>
      {!isCameraActive ? (
        <button onClick={startCamera} style={styles.button}>
          📷 Foto aufnehmen
        </button>
      ) : (
        <div style={styles.cameraContainer}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            style={styles.video}
          />
          <div style={styles.controls}>
            <button onClick={capturePhoto} style={styles.captureButton}>
              📸 Aufnehmen
            </button>
            <button onClick={stopCamera} style={styles.cancelButton}>
              ❌ Abbrechen
            </button>
          </div>
        </div>
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
  cameraContainer: {
    width: '100%',
  },
  video: {
    width: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    backgroundColor: '#000',
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  captureButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
}