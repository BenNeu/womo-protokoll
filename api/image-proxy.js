export default async function handler(req, res) {
  const { url } = req.query
  
  if (!url) {
    return res.status(400).json({ error: 'URL fehlt' })
  }

  try {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', contentType)
    res.send(Buffer.from(buffer))
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden des Bildes' })
  }
}