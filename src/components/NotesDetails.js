import { useNotesContext } from '../hooks/useNotesContext'
import { useAuthContext } from '../hooks/useAuthContext'

// date fns
import formatDistanceToNow from 'date-fns/formatDistanceToNow'

// const BACKEND_URL = 'http://localhost:4000'
const BACKEND_URL = 'https://backend-v1yl.onrender.com/'

const NoteDetails = ({ note }) => {
  const { dispatch } = useNotesContext()
  const { user } = useAuthContext()

  const handleClick = async () => {
    if (!user) {
      return
    }

    const response = await fetch(BACKEND_URL + '/api/notes/' + note._id, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${user.token}`
      }
    })
    const json = await response.json()

    if (response.ok) {
      dispatch({type: 'DELETE_NOTE', payload: json})
    }
  }

  return (
    <div className="note-details">
      <h4>{note.title}</h4>
      <p><strong>Section: </strong>{note.section}</p>
      <p>{formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}</p>
      <span className="material-symbols-outlined" onClick={handleClick}>delete</span>
    </div>
  )
}

export default NoteDetails