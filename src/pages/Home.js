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

      <form className="create" onSubmit={handleUpload}>
        <h3>Upload Files</h3>
        <p>Allowed:.pdf, .doc, .docx, .txt</p>

        <label>Choose files (you can select multiple):</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileChange}
          multiple
        />

        <button>
          {selectedFiles.length > 0
            ? `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`
            : 'Upload'}
        </button>

        {error && <div className="error">{error}</div>}
      </form>

      {queue.length > 0 && (
        <div className="upload-queue">
          <h3>Upload Progress</h3>
          {queue.map((item, idx) => (
            <div key={idx} className="queue-item">
              <span className="queue-filename">{item.name}</span>
              {item.status === 'queued' && (
                <span className="queue-status queued">Queued</span>
              )}
              {item.status === 'uploading' && (
                <span className="queue-status uploading">Uploading {item.progress}%</span>
              )}
              {item.status === 'done' && (
                <span className="queue-status done">Done</span>
              )}
              {item.status === 'error' && (
                <span className="queue-status error">{item.error}</span>
              )}

              {item.status === 'uploading' && (
                <div style={{ background: '#ddd', borderRadius: '4px', height: '8px', marginTop: '6px' }}>
                  <div style={{
                    background: '#4CAF50',
                    width: item.progress + '%',
                    height: '8px',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease'
                  }} />
                </div>
              )}

            </div>
          ))}

          {queue.every(item => item.status === 'done' || item.status === 'error') && (
            <button onClick={() => setQueue([])}>Clear</button>
          )}
        </div>
      )}

      <div className="files">
        <h3>Your Files ({files.length} / {MAX_FILES})</h3>

        {files.length === 0 && <p>No files uploaded yet.</p>}
        {files.map(file => (
          <div className="file-details" key={file._id}>

            <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>📄</span>

            <h4>{file.originalName}</h4>

            <p>Size: {formatSize(file.size)}</p>
            <p>Uploaded: {new Date(file.createdAt).toLocaleDateString()}</p>
              <a
                href={BACKEND_URL + '/uploads/' + file.filename}
                target="_blank"
                rel="noreferrer"
              >
              Download
            </a>

            <span
              className="material-symbols-outlined"
              onClick={() => handleDelete(file._id)}
              style={{ cursor: 'pointer', marginLeft: '12px', verticalAlign: 'middle' }}
            >
              delete
            </span>

          </div>
        ))}
      </div>

    </div>
  )
}

export default Home
