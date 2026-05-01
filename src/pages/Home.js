import { useState, useEffect } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'

// const BACKEND_URL = 'http://localhost:4000'
const BACKEND_URL = 'https://backend-v1yl.onrender.com'

const MAX_FILES = 50

const Home = () => {
  const { user } = useAuthContext()
  const [files, setFiles] = useState([])
  const [selectedFiles, setSelectedFiles] = useState([])
  const [queue, setQueue] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchFiles = async () => {
      const response = await fetch(BACKEND_URL + '/api/files', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      })
      const json = await response.json()
      if (response.ok) {
        setFiles(json)
      }
    }
    if (user) {
      fetchFiles()
    }
  }, [user])

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files))
    setError(null)
    setQueue([])
  }

  const uploadOneFile = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      }

      xhr.onload = () => {
        const json = JSON.parse(xhr.responseText)
        if (xhr.status === 200) {
          resolve(json)
        } else {
          reject(new Error(json.error || 'Upload failed'))
        }
      }

      xhr.onerror = () => reject(new Error('Network error. Please try again.'))

      const formData = new FormData()
      formData.append('file', file)

      xhr.open('POST', BACKEND_URL + '/api/files')
      xhr.setRequestHeader('Authorization', `Bearer ${user.token}`)
      xhr.send(formData)
    })
  }

  const handleUpload = async (e) => {
    e.preventDefault()

    if (selectedFiles.length === 0) {
      setError('Please select at least one file')
      return
    }
    const initialQueue = selectedFiles.map(file => ({
      name: file.name,
      status: 'queued',
      progress: 0,
      error: null
    }))
    setQueue(initialQueue)
    setError(null)

    const newFiles = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]

      setQueue(prev =>
        prev.map((item, idx) => idx === i ? { ...item, status: 'uploading' } : item)
      )

      try {
        const savedFile = await uploadOneFile(file, (percent) => {
          setQueue(prev =>
            prev.map((item, idx) => idx === i ? { ...item, progress: percent } : item)
          )
        })

        setQueue(prev =>
          prev.map((item, idx) => idx === i ? { ...item, status: 'done', progress: 100 } : item)
        )
        newFiles.push(savedFile)

      } catch (err) {
        setQueue(prev =>
          prev.map((item, idx) => idx === i ? { ...item, status: 'error', error: err.message } : item)
        )
      }
    }
    if (newFiles.length > 0) {
      setFiles(prev => [...newFiles.reverse(), ...prev])
    }
    setSelectedFiles([])
    e.target.reset()
  }
  const handleDelete = async (id) => {
    const response = await fetch(BACKEND_URL + '/api/files/' + id, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
    if (response.ok) {
      setFiles(prev => prev.filter(f => f._id !== id))
    }
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="home">

      {/* ======================== UPLOAD CARD ======================== */}
      <div className="upload-card">
        <div className="upload-card-header">
          <h3>Upload Files</h3>
          <p>Accepted formats: PDF, DOC, DOCX, TXT</p>
        </div>

        <form onSubmit={handleUpload}>

          <div className={`upload-dropzone ${selectedFiles.length > 0 ? 'has-files' : ''}`}>
            <div className="upload-dropzone-icon">☁️</div>

            <p className="upload-dropzone-text">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                : 'Click to browse files'}
            </p>
            <span className="upload-dropzone-hint">PDF, DOC, DOCX, TXT · max 50 files</span>

            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              multiple
            />
          </div>

          <button className="upload-btn">
            {selectedFiles.length > 0
              ? `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
              : 'Upload'}
          </button>

          {error && <div className="error">{error}</div>}
        </form>
      </div>

      {/* ======================== UPLOAD QUEUE ======================== */}
      {queue.length > 0 && (
        <div className="queue-card">
          <h3>Upload Progress</h3>

          {queue.map((item, idx) => (
            <div key={idx} className="queue-item">

              <span className="queue-filename">{item.name}</span>

              {item.status === 'uploading' && (
                <div className="queue-progress-bar">
                  <div className="queue-progress-fill" style={{ width: item.progress + '%' }} />
                </div>
              )}

              <span className={`queue-status ${item.status}`}>
                {item.status === 'queued'    && 'Queued'}
                {item.status === 'uploading' && item.progress + '%'}
                {item.status === 'done'      && '✓ Done'}
                {item.status === 'error'     && item.error}
              </span>

            </div>
          ))}

          {queue.every(item => item.status === 'done' || item.status === 'error') && (
            <button className="queue-clear-btn" onClick={() => setQueue([])}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* ======================== FILES SECTION ======================== */}
      <div className="files-section">

        <div className="files-section-header">
          <h3>Your Files</h3>
          <span className="files-count-badge">{files.length} / {MAX_FILES}</span>
        </div>

        {files.length === 0 && (
          <div className="files-empty">
            <div className="files-empty-icon">📁</div>
            <p>No files uploaded yet</p>
          </div>
        )}

        <div className="files-grid">
          {files.map(file => (
            <div className="file-card" key={file._id}>

              {file.thumbnailFilename ? (
                <img
                  className="file-card-thumbnail"
                  src={BACKEND_URL + '/thumbnails/' + file.thumbnailFilename}
                  alt={'Preview of ' + file.originalName}
                />
              ) : (
                <div className="file-card-icon">📄</div>
              )}


              <div className="file-card-name">{file.originalName}</div>

              <div className="file-card-meta">
                {formatSize(file.size)} · {new Date(file.createdAt).toLocaleDateString()}
              </div>

              <div className="file-card-actions">
                <a
                  className="file-card-download"
                  href={BACKEND_URL + '/uploads/' + file.filename}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>

                <span
                  className="file-card-delete material-symbols-outlined"
                  onClick={() => handleDelete(file._id)}
                >
                  delete
                </span>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  )
}

export default Home
