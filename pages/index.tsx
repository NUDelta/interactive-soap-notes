import Link from 'next/link';
import { createSoapNoteFixtures } from '../models/fixtures/soapNotes';
import { fetchAllSoapNotes } from '../controllers/soapNotes/fetchSoapNotes';

export default function Home({ sigs }): JSX.Element {
  return (
    <>
      <div className="container m-auto w-3/4">
        <div className="mb-5">
          <h1 className="font-bold text-4xl">
            Welcome to Interactive SOAP Notes
          </h1>
        </div>

        {/* Section for each SIG */}
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
                    className="grid grid-cols-2 gap-y-5 auto-rows-auto w-full"
                    key={`${sig.name}-${soapNote.date}`}
                  >
                    <div className="col-span-1">
                      <Link
                        href={`/soap-notes/${sig.abbreviation.toLowerCase()}_${
                          soapNote.date
                        }`}
                      >
                        <a>
                          <h3 className="text-md underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
                            SOAP Notes for {soapNote.date}
                          </h3>
                        </a>
                      </Link>
                    </div>
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
  // TODO: only create fixtures on devlopment server
  await createSoapNoteFixtures();

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
          day: 'numeric',
        })
        .replace(/\//g, '-');
    };

    const longDate = (date) => {
      return date.toLocaleDateString('en-us', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
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
            date: shortDate(soapNote.date),
            lastUpdated: longDate(soapNote.lastUpdated),
          },
        ],
      });
    } else {
      // add the SOAP note to the SIG's list of SOAP notes
      acc[sigIndex].soapNotes.push({
        date: shortDate(soapNote.date),
        lastUpdated: longDate(soapNote.lastUpdated),
      });
    }

    return acc;
  }, []);

  return {
    props: { sigs },
  };
};
