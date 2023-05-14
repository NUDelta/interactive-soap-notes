import Link from 'next/link';

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
  // get a list of all SIGs and their SOAP notes for each week
  const sigs = [
    {
      name: 'Networked Orchestration Technologies',
      abbreviation: 'NOT',
      soapNotes: [
        {
          date: '2023-05-08',
          lastUpdated: '2023-05-08 18:00:00',
        },
        {
          date: '2023-05-01',
          lastUpdated: '2023-05-01 18:30:00',
        },
      ],
    },
    {
      name: 'Opportunistic Collective Experiences',
      abbreviation: 'OCE',
      soapNotes: [
        {
          date: '2023-05-10',
          lastUpdated: '2023-05-10 15:00:00',
        },
        {
          date: '2023-05-03',
          lastUpdated: '2023-05-10 15:15:00',
        },
      ],
    },
    {
      name: 'Readily Available Learning Environments',
      abbreviation: 'RALE',
      soapNotes: [
        {
          date: '2023-05-08',
          lastUpdated: '2023-05-08 16:00:00',
        },
        {
          date: '2023-05-01',
          lastUpdated: '2023-05-01 16:30:00',
        },
      ],
    },
    {
      name: 'Context-Aware Metacognitive Practices',
      abbreviation: 'CAMP',
      soapNotes: [
        {
          date: '2023-05-12',
          lastUpdated: '2023-05-12 11:45:00',
        },
        {
          date: '2023-05-05',
          lastUpdated: '2023-05-12 11:45:00',
        },
      ],
    },
    {
      name: 'Human-AI Tools',
      abbreviation: 'HAT',
      soapNotes: [
        {
          date: '2023-05-10',
          lastUpdated: '2023-05-10 16:00:00',
        },
        {
          date: '2023-05-03',
          lastUpdated: '2023-05-10 16:15:00',
        },
      ],
    },
  ];

  return {
    props: { sigs },
  };
};
