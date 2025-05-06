import Link from 'next/link';
import { fetchAllCAPNotes } from '../controllers/capNotes/fetchCAPNotes';
import Head from 'next/head';
import { longDate, shortDate } from '../lib/helperFns';
import { useEffect, useState } from 'react';

export default function Home({ sigs }): JSX.Element {
  // store state for each SIG on whether to show latest or all CAP notes
  const [showAllNotes, setShowAllNotes] = useState(false);

  // use a state variable for sigs so dates can be updated to locale time
  const [sigsState, setSigsState] = useState(sigs);
  useEffect(() => {
    setSigsState(
      sigs.map((sig) => ({
        ...sig,
        capNotes: sig.capNotes.map((capNote) => ({
          ...capNote,
          date: shortDate(new Date(capNote.date)),
          lastUpdated: longDate(new Date(capNote.lastUpdated))
        }))
      }))
    );
  }, []);

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="container m-auto mt-3 h-dvh w-11/12 overflow-auto">
        <div className="mb-5">
          <h1 className="text-4xl font-bold">
            Welcome to Interactive CAP Notes
          </h1>
        </div>

        {/* button to toggle all notes or just last note */}
        <button
          className="mb-4 h-10 rounded-full bg-blue-500 px-4 py-1 text-xs font-bold text-white hover:bg-blue-700"
          onClick={() => setShowAllNotes(!showAllNotes)}
        >
          {showAllNotes ? 'Show Most Recent Notes' : 'Show All Notes'}
        </button>

        {/* Section for each SIG */}
        {/* TODO: make into a filterable table */}

        <div className="col-span-2 w-full">
          {/* List of SIGs */}
          {sigsState.map((sig, i) => (
            <div className="mb-10 w-full" key={sig.abbreviation}>
              {/* Header Info for each SIG */}
              <div className="mb-3 grid w-full auto-rows-auto grid-cols-5 gap-y-5 border-b border-black text-xl font-bold">
                <h2 className="col-span-2">
                  {sig.name} ({sig.abbreviation})
                </h2>
                <h2 className="col-span-1">Student Reflections</h2>
                <h2 className="col-span-1">SIG Date</h2>
                <h2 className="col-span-1">Last Updated</h2>
              </div>
              {/* List of CAP Notes for a SIG */}
              {sig.capNotes
                .filter((capNote) => {
                  // if show all, don't filter out anything; otherwise, only include the latest notes
                  return showAllNotes ? true : capNote.isLatest;
                })
                .map((capNote) => (
                  <div
                    className="grid w-full auto-rows-auto grid-cols-5 gap-y-5 hover:bg-blue-200 hover:font-bold"
                    key={`${capNote.project}-${capNote.date}`}
                  >
                    {/* Project Title and Link to CAP Note */}
                    <div className="col-span-2">
                      <Link href={`/cap-notes/${capNote.id}`}>
                        <h3 className="text-md text-blue-600 underline visited:text-purple-600 hover:text-blue-800">
                          {capNote.project}
                        </h3>
                      </Link>
                    </div>

                    {/* Link to Reflection */}
                    <div className="col-span-1">
                      <Link href={`/reflections/${capNote.id}`}>
                        <h3 className="text-md text-blue-600 underline visited:text-purple-600 hover:text-blue-800">
                          Reflection Page
                        </h3>
                      </Link>
                    </div>

                    {/* Date of CAP Note */}
                    <div className="col-span-1">{capNote.date}</div>

                    {/* Last Updated for CAP Note*/}
                    <div className="col-span-1">{capNote.lastUpdated}</div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// use serverside rendering to generate this page
export const getServerSideProps = async () => {
  // fetch all CAP notes
  const capNotes = await fetchAllCAPNotes();

  // sort cap notes by date in descending order
  capNotes.sort(
    (a, b) =>
      a.sigName.localeCompare(b.sigName) || new Date(b.date) - new Date(a.date)
  );

  // get a list of SIGs from all CAP notes
  let haveNoteForProject = new Set();
  const sigs = capNotes.reduce((acc, capNote) => {
    // check if we have a note stored already for this project
    let isLatest = false;
    if (!haveNoteForProject.has(capNote.project)) {
      haveNoteForProject.add(capNote.project);
      isLatest = true;
    }

    // create the cap note object to add to list
    const capNoteObj = {
      id: capNote._id.toString(),
      project: capNote.project,
      date: capNote.date.toISOString(),
      lastUpdated: capNote.lastUpdated.toISOString(),
      isLatest
    };

    // check if the SIG is already in the list
    const sigIndex = acc.findIndex(
      (sig) => sig.abbreviation === capNote.sigAbbreviation
    );
    if (sigIndex === -1) {
      // add the SIG to the list
      acc.push({
        name: capNote.sigName,
        abbreviation: capNote.sigAbbreviation,
        capNotes: [capNoteObj]
      });
    } else {
      // add the CAP note to the SIG's list of CAP notes
      acc[sigIndex].capNotes.push(capNoteObj);
    }

    return acc;
  }, []);

  return {
    props: { sigs }
  };
};
