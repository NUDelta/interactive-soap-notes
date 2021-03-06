import { useRouter } from "next/router";
import useSWR from "swr";
import SOAPNote from "../../components/SOAPNote";

// route?? to edit a particular SOAP note 
// fetches data from a particular route and populates the note form with it

const fetcher = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((json) => json.data);

const EditNote = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: note, error } = useSWR(id ? `/api/notes/${id}` : null, fetcher);

  if (error) return <p>Failed to load</p>;
  if (!note) return <p>Loading...</p>;

  const SOAPNoteForm = {
    S: note.S,
    O: note.O,
    A: note.A,
    P: note.P,
  };

  return <SOAPNote noteId="edit-note-form" SOAPNoteForm={SOAPNoteForm} editing={true} />;
};

export default EditNote;
