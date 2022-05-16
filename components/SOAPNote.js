import { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";

// form to add a new SOAP note
// although maybe it shouldn't be a form for long

const SOAPNote = ({ noteId, SOAPNoteForm, editing = false }) => {
  const router = useRouter();
  const contentType = "application/json";
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const [form, setForm] =  useState(
    {S: SOAPNoteForm.S,
    O: SOAPNoteForm.O,
    A: SOAPNoteForm.A,
    P: SOAPNoteForm.P,});

  /* The PUT method edits an existing entry in the mongodb database. */
  // form must be structured in the same way 
  const putData = async (form) => {
    const { id } = router.query;

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(form)
        //body: JSON.stringify({S: {name: 'S', entries: form.S}, O: {name: 'O', entries: form.O}, A: {name: 'A', entries: form.A}, P: {name: 'P', entries: form.P}}),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      const { data } = await res.json();

      mutate(`/api/notes/${id}`, data, false); // Update the local data without a revalidation
      router.push("/");
    } catch (error) {
      setMessage("Failed to update SOAP note");
    }
  };

  /* The POST method adds a new entry in the mongodb database. */
  const postData = async (form) => {
    try { // make an api/notes
      console.log(JSON.stringify(form))
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          Accept: contentType,
          "Content-Type": contentType,
        },
        body: JSON.stringify(form),
      });

      // Throw error with status code in case Fetch API req failed
      if (!res.ok) {
        throw new Error(res.status);
      }

      // const { data } = await res.json(); // this only has an id
      // console.log(data); // body is ReadableStream, bodyUsed: false
      router.push("/"); 
    } catch (error) {
      setMessage("Failed to add note");
    }
  };

  const handleChange = (e) => {
    const target = e.target;
    const value = target.value;
    const name = target.name;

    // want to set only 
    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // ?
    const errs = formValidate();
    if (Object.keys(errs).length === 0) {
      editing ? putData(form) : postData(form);
    } else {
      setErrors({ errs });
    }
  };

  /* Makes sure subjective and objective section are filled out*/
  const formValidate = () => {
    let err = {};
    if (!form.S) err.S = "Subjective section is required";
    if (!form.O) err.O = "Objective section is required";
    return err;
  };

  return (
    <>
      <form id={noteId} onSubmit={handleSubmit}>
        <label htmlFor="subjective">S</label>
        <input
          type="text"
          name="S"
          value={form.S}
          onChange={handleChange}
          required
        />

        <label htmlFor="objective">O</label>
        <input
          type="text"
          name="O"
          value={form.O}
          onChange={handleChange}
          required
        />

        <label htmlFor="assessment">A</label>
        <input
          type="text"
          name="A"
          value={form.A}
          onChange={handleChange}
          required
        />

        <label htmlFor="plan">P</label>
        <input
          type="text"
          name="P"
          value={form.P}
          onChange={handleChange}
          required
        />

        <button type="submit" className="btn">
          Submit
        </button>
      </form>
      <p>{message}</p>
      <div>
        {Object.keys(errors).map((err, index) => (
          <li key={index}>{err}</li>
        ))}
      </div>
    </>
  );
};

export default SOAPNote;