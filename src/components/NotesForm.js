import { useState } from 'react'
import { useNotesContext } from '../hooks/useNotesContext'
import { useAuthContext } from '../hooks/useAuthContext'

const NoteForm = () => {
  const { dispatch } = useNotesContext()
  const { user } = useAuthContext()

  const [title, setTitle] = useState('')
  const [section, setSection] = useState('')
  const [error, setError] = useState(null)
  const [emptyFields, setEmptyFields] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!user) {
      setError('You must be logged in')
      return
    }

    const note = {title, section}
    
    try {
        const response = await fetch('http://localhost:4000/api/notes', {
          method: 'POST',
          body: JSON.stringify(note),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          }
        });
      
        if (!response.ok) {
          const json = await response.json();
          setError(json.error);
          setEmptyFields(json.emptyFields);
        } else {
          // Handle successful response
          const json = await response.json();
          setEmptyFields([]);
          setError(null);
          setTitle('');
          setSection('');
          dispatch({ type: 'CREATE_NOTE', payload: json });
        }
      } catch (error) {
        // Handle network errors
        console.error('Network error:', error);
        setError('Network error. Please try again.');
        setEmptyFields([]);
      }
  }

  return (
    <form className="create" onSubmit={handleSubmit}> 
      <h3>Add a New Note</h3>

      <label>Title:</label>
      <input 
        type="text" 
        onChange={(e) => setTitle(e.target.value)} 
        value={title}
        className={emptyFields && emptyFields.includes('title') ? 'error' : ' '}
      />

      <label>Section:</label>
      <input 
        type="text" 
        onChange={(e) => setSection(e.target.value)} 
        value={section}
        className={emptyFields && emptyFields.includes('section') ? 'error' : ' '}
      />

      <button>Add Notes</button>
      {error && <div className="error">{error}</div>}
    </form>
  )
}

export default NoteForm