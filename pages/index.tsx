import Link from 'next/link';
import { fetchAllCAPNotes } from '../controllers/capNotes/fetchCAPNotes';
import Head from 'next/head';
import { longDate } from '../lib/helperFns';

export default function Home({ sigs }): JSX.Element {
  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className="container m-auto w-3/4 mt-3">
        <div className="mb-5">
          <h1 className="font-bold text-4xl">
            Welcome to Interactive SOAP Notes
          </h1>
        </div>

        {/* Section for each SIG */}
        {/* TODO: make into a filterable table */}
        <div className="w-full col-span-2">
          {/* List of SIGs */}
          {sigs.map((sig, i) => (
            <div className="w-full mb-10" key={sig.abbreviation}>
              <div className="col-span-2">
                <h2 className="font-bold text-xl border-b border-black mb-3">
                  {sig.name} ({sig.abbreviation})
                </h2>
                {/* List of CAP Notes for a SIG */}
                {sig.capNotes.map((capNote) => (
                  <div
                    className="grid grid-cols-4 gap-y-5 auto-rows-auto w-full"
                    key={`${capNote.project}-${capNote.date}`}
                  >
                    <div className="col-span-2">
                      <Link
                        href={`/soap-notes/${sig.abbreviation.toLowerCase()}_${encodeURIComponent(
                          capNote.project
                        )}_${capNote.date}`}
                      >
                        <h3 className="text-md underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                          {/* {capNote.project} -- {capNote.date} */}
                          {capNote.project}
                        </h3>
                      </Link>
                    </div>
                    <div className="col-span-1">{capNote.date}</div>
                    <div className="col-span-1">
                      Last Updated: {capNote.lastUpdated}
                    </div>
                  </div>
                ))}
              </div>
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

  // get a list of SIGs from all CAP notes
  const sigs = capNotes.reduce((acc, capNote) => {
    // setup a date function
    const shortDate = (date) => {
      return date
        .toLocaleDateString('en-us', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        })
        .replace(/\//g, '-');
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
        capNotes: [
          {
            project: capNote.project,
            date: shortDate(capNote.date),
            lastUpdated: longDate(capNote.lastUpdated)
          }
        ]
      });
    } else {
      // add the CAP note to the SIG's list of CAP notes
      acc[sigIndex].capNotes.push({
        project: capNote.project,
        date: shortDate(capNote.date),
        lastUpdated: longDate(capNote.lastUpdated)
      });
    }

    return acc;
  }, []);

  return {
    props: { sigs }
  };
};
