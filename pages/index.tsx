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
      <div className="container m-auto w-11/12 h-dvh overflow-auto mt-3">
        <div className="mb-5">
          <h1 className="font-bold text-4xl">
            Welcome to Interactive CAP Notes
          </h1>
        </div>

        {/* button to toggle all notes or just last note */}
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1 h-10 rounded-full mb-4"
          onClick={() => setShowAllNotes(!showAllNotes)}
        >
          {showAllNotes ? 'Show Most Recent Notes' : 'Show All Notes'}
        </button>

        {/* Section for each SIG */}
        {/* TODO: make into a filterable table */}

        <div className="w-full col-span-2">
          {/* List of SIGs */}
          {sigsState.map((sig, i) => (
            <div className="w-full mb-10" key={sig.abbreviation}>
              {/* Header Info for each SIG */}
              <div className="grid grid-cols-5 gap-y-5 auto-rows-auto w-full border-b border-black mb-3 font-bold text-xl">
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
                    className="grid grid-cols-5 gap-y-5 auto-rows-auto w-full"
                    key={`${capNote.project}-${capNote.date}`}
                  >
                    {/* Project Title and Link to CAP Note */}
                    <div className="col-span-2">
                      <Link
                        href={`/soap-notes/${sig.abbreviation.toLowerCase()}_${encodeURIComponent(
                          capNote.project
                        )}_${new Date(capNote.date).toISOString().split('T')[0]}`}
                      >
                        <h3 className="text-md underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                          {capNote.project}
                        </h3>
                      </Link>
                    </div>

                    {/* Link to Reflection */}
                    <div className="col-span-1">
                      <Link
                        href={`/reflections/${sig.abbreviation.toLowerCase()}_${encodeURIComponent(
                          capNote.project
                        )}_${new Date(capNote.date).toISOString().split('T')[0]}`}
                      >
                        <h3 className="text-md underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
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

    // check if the SIG is already in the list
    const sigIndex = acc.findIndex(
      (sig) => sig.abbreviation === capNote.sigAbbreviation
    );
    if (sigIndex === -1) {
      // add the SIG to the list
      acc.push({
        name: capNote.sigName,
        abbreviation: capNote.sigAbbreviation,
        capNotes: [
          {
            project: capNote.project,
            date: capNote.date.toISOString(),
            lastUpdated: capNote.lastUpdated.toISOString(),
            isLatest
          }
        ]
      });
    } else {
      // add the CAP note to the SIG's list of CAP notes
      acc[sigIndex].capNotes.push({
        project: capNote.project,
        date: capNote.date.toISOString(),
        lastUpdated: capNote.lastUpdated.toISOString(),
        isLatest
      });
    }

    return acc;
  }, []);

  return {
    props: { sigs }
  };
};
