import SOAPNote from "../components/SOAPNote.js";

const NewNote = () => {
  const noteForm = {
    S: {
      name: 'S',
      entries: "",
    },
    O: {
      name: 'O',
      entries: "",
    },
    A: {
      name: 'A',
      entries: "",
    },
    P: {
      name: 'P',
      entries: "",
    },
  };

  return <SOAPNote noteId="add-note-form" SOAPNoteForm={noteForm} />;
};

export default NewNote;


// import Form from "../components/Form";

// const NewPet = () => {
//   const petForm = {
//     name: "",
//     owner_name: "",
//     species: "",
//     age: 0,
//     poddy_trained: false,
//     diet: [],
//     image_url: "",
//     likes: [],
//     dislikes: [],
//   };

//   return <Form formId="add-pet-form" petForm={petForm} />;
// };

// export default NewPet;
