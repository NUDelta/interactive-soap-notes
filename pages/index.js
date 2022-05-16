import Link from "next/link";
import dbConnect from "../lib/dbConnect";
import SOAPNote from "../models/SOAPNote";

// landing page for all SOAP notes
// should be so that if you click on the mini version of one, it brings you 
// to that page... I guess it can be in editing mode

// BIG THING TO CHANGE

// currently a dummy... 
const Index = ({ notes }) => { // should make the ID something more useful, like mentor name + date
  return (
  <>
    {notes.map((note) => (
      <div key={note._id}>
        <h5 className="note-name">{note._id}</h5>
        <div className="btn-container">
          <Link href="/[id]/edit" as={`/${note._id}/edit`}>
            <button className="btn edit">Edit Note</button>
          </Link>
          <Link href="/[id]" as={`/${note._id}`}>
            <button className="btn view">View Note</button>
          </Link>
        </div>
      </div>
    ))}
  </>)
};

// const Index = ({ pets }) => (
//   <>
//     {/* Create a card for each pet */}
//     {pets.map((pet) => (
//       <div key={pet._id}>
//         <div className="card">
//           <img src={pet.image_url} />
//           <h5 className="pet-name">{pet.name}</h5>
//           <div className="main-content">
//             <p className="pet-name">{pet.name}</p>
//             <p className="owner">Owner: {pet.owner_name}</p>

//             {/* Extra Pet Info: Likes and Dislikes */}
//             <div className="likes info">
//               <p className="label">Likes</p>
//               <ul>
//                 {pet.likes.map((data, index) => (
//                   <li key={index}>{data} </li>
//                 ))}
//               </ul>
//             </div>
//             <div className="dislikes info">
//               <p className="label">Dislikes</p>
//               <ul>
//                 {pet.dislikes.map((data, index) => (
//                   <li key={index}>{data} </li>
//                 ))}
//               </ul>
//             </div>

//             <div className="btn-container">
//               <Link href="/[id]/edit" as={`/${pet._id}/edit`}>
//                 <button className="btn edit">Edit</button>
//               </Link>
//               <Link href="/[id]" as={`/${pet._id}`}>
//                 <button className="btn view">View</button>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     ))}
//   </>
// );

/* Retrieves SOAP note data from mongodb database */
// called when page is requested
// runs on terminal on computer
export async function getServerSideProps() {
  await dbConnect();
  console.log("running")

  /* find all the data in our database */
  const result = await SOAPNote.find({});
  const notes = result.map((doc) => {
    const note = doc.toObject();
    note._id = note._id.toString();
    note.S = note.S.toString();
    note.O = note.O.toString();
    note.A = note.A.toString();
    note.P = note.P.toString();
    return note;
  });

  return { props: { notes: notes } };
}

export default Index;
