import Link from 'next/link';
import { fetchAllSoapNotes } from '../controllers/soapNotes/fetchSoapNotes';
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
                {/* List of SOAP Notes for a SIG */}
                {sig.soapNotes.map((soapNote) => (
                  <div
                    className="grid grid-cols-4 gap-y-5 auto-rows-auto w-full"
                    key={`${soapNote.project}-${soapNote.date}`}
                  >
                    <div className="col-span-2">
                      <Link
                        href={`/soap-notes/${sig.abbreviation.toLowerCase()}_${encodeURIComponent(
                          soapNote.project
                        )}_${soapNote.date}`}
                      >
                        <h3 className="text-md underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                          {/* {soapNote.project} -- {soapNote.date} */}
                          {soapNote.project}
                        </h3>
                      </Link>
                    </div>
                    <div className="col-span-1">{soapNote.date}</div>
                    <div className="col-span-1">
                      Last Updated: {soapNote.lastUpdated}
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
  // fetch all SOAP notes
  const soapNotes = await fetchAllSoapNotes();

  // get a list of SIGs from all SOAP notes
  const sigs = soapNotes.reduce((acc, soapNote) => {
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
      (sig) => sig.abbreviation === soapNote.sigAbbreviation
    );
    if (sigIndex === -1) {
      // add the SIG to the list
      acc.push({
        name: soapNote.sigName,
        abbreviation: soapNote.sigAbbreviation,
        soapNotes: [
          {
            project: soapNote.project,
            date: shortDate(soapNote.date),
            lastUpdated: longDate(soapNote.lastUpdated)
          }
        ]
      });
    } else {
      // add the SOAP note to the SIG's list of SOAP notes
      acc[sigIndex].soapNotes.push({
        project: soapNote.project,
        date: shortDate(soapNote.date),
        lastUpdated: longDate(soapNote.lastUpdated)
      });
    }

    return acc;
  }, []);

  return {
    props: { sigs }
  };
};
