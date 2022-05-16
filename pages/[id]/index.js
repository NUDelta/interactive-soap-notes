import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import dbConnect from "../../lib/dbConnect";
import SOAPNote from "../../models/SOAPNote";

// BIG THING TO CHANGE

// page that displays a single note. CSS should be here
const SOAPNotePage = ({ note }) => {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const handleDelete = async () => {
    const noteID = router.query.id;

    try {
      await fetch(`/api/notes/${noteID}`, {
        method: "Delete",
      });
      router.push("/");
    } catch (error) {
      setMessage("Failed to delete the note.");
    }
  };

  // commented out delete for now
  // should be no reason to allow delete
  return (
    <div key={note._id}>
      <div className="btn-container">
        <Link href="/[id]/edit" as={`/${note._id}/edit`}>
          <button className="btn edit">Edit Note</button>
        </Link>
        {/* <button className="btn delete" onClick={handleDelete}>
          Delete
        </button> */}
      </div>
      <div class="grid grid-cols-20 grid-rows-10 items-center note-yellow">
        <div class="border-2 border-black col-start-2 col-span-4 row-start-1 row-span-1">
          <p>S</p>
        </div>
        <div class="col-start-2 col-span-4 row-start-2 row-span-7">
          <p>{note.S}</p>
        </div>
        <div class="border-2 border-black col-start-5 col-span-4 row-start-1 row-span-1">
          <p>O</p>
        </div>
        <div class="col-start-5 col-span-4 row-start-2 row-span-7">
          <p>{note.O}</p>
        </div>
        <div class="border-2 border-black col-start-2 col-span-7 row-start-9 row-span-1">
          <p>A</p>
        </div>
        <div class="col-start-2 col-span-7 row-start-10 row-span-5">
          <p>{note.A}</p>
        </div>
        <div class="border-2 border-black col-start-2 col-span-7 row-start-15 row-span-1">
          <p>P</p>
        </div>
        <div class="col-start-2 col-span-7 row-start-16 row-span-5">
          <p>{note.P}</p>
        </div>
      </div>
    {message && <p>{message}</p>}
    </div>
  );
};

export async function getServerSideProps({ params }) {
  await dbConnect();

  const note = await SOAPNote.findById(params.id).lean();
  note._id = note._id.toString();
  note.S = note.S.toString();
  note.O = note.O.toString();
  note.A = note.A.toString();
  note.P = note.P.toString();

  return { props: { note } };
}

export default SOAPNotePage;


/* Allows you to view pet card info and delete pet card*/
// const PetPage = ({ pet }) => {
//   const router = useRouter();
//   const [message, setMessage] = useState("");
//   const handleDelete = async () => {
//     const petID = router.query.id;

//     try {
//       await fetch(`/api/pets/${petID}`, {
//         method: "Delete",
//       });
//       router.push("/");
//     } catch (error) {
//       setMessage("Failed to delete the pet.");
//     }
//   };

//   return (
//     <div key={pet._id}>
//       <div className="card">
//         <img src={pet.image_url} />
//         <h5 className="pet-name">{pet.name}</h5>
//         <div className="main-content">
//           <p className="pet-name">{pet.name}</p>
//           <p className="owner">Owner: {pet.owner_name}</p>

//           {/* Extra Pet Info: Likes and Dislikes */}
//           <div className="likes info">
//             <p className="label">Likes</p>
//             <ul>
//               {pet.likes.map((data, index) => (
//                 <li key={index}>{data} </li>
//               ))}
//             </ul>
//           </div>
//           <div className="dislikes info">
//             <p className="label">Dislikes</p>
//             <ul>
//               {pet.dislikes.map((data, index) => (
//                 <li key={index}>{data} </li>
//               ))}
//             </ul>
//           </div>

//           <div className="btn-container">
//             <Link href="/[id]/edit" as={`/${pet._id}/edit`}>
//               <button className="btn edit">Edit</button>
//             </Link>
//             <button className="btn delete" onClick={handleDelete}>
//               Delete
//             </button>
//           </div>
//         </div>
//       </div>
//       {message && <p>{message}</p>}
//     </div>
//   );
// };

// export async function getServerSideProps({ params }) {
//   await dbConnect();

//   const pet = await Pet.findById(params.id).lean();
//   pet._id = pet._id.toString();

//   return { props: { pet } };
// }

// export default PetPage;
