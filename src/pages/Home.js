import { useEffect } from "react"
import { useNotesContext } from "../hooks/useNotesContext"
import { useAuthContext } from "../hooks/useAuthContext"

// components
import NoteDetails from "../components/NotesDetails"
import NoteForm from "../components/NotesForm"

const Home = () => {
  const { notes, dispatch } = useNotesContext()
  const {user} = useAuthContext()

  useEffect(() => {
    const fetchNotes = async () => {
      const response = await fetch('http://localhost:4000/api/notes', {
        headers: {'Authorization': `Bearer ${user.token}`},
      })
      const json = await response.json()

      if (response.ok) {
        dispatch({type: 'SET_NOTES', payload: json})
      }
    }

    if (user) {
      fetchNotes()
    }
  }, [dispatch])

  return (
    <div className="home">
      <div className="notes">
        {notes && notes.map(note => (
          <NoteDetails note={note} key={note._id} />
        ))}
      </div>
      <NoteForm />
    </div>
  )
}

export default Home