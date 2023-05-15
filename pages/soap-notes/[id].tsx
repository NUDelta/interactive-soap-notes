import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState } from 'react';

import TextBox from '../../components/TextBox';
import Link from 'next/link';
import { fetchSoapNote } from '../../controllers/soapNotes/fetchSoapNotes';
import { mutate } from 'swr';
import { SOAP } from '../../models/SOAPModel';

export default function SOAPNote({
  soapNoteInfo,
  data,
  autocompleteTriggersOptions,
}): JSX.Element {
  // hold data from the current soap notes
  const [soapData, setSoapData] = useState(data);

  // let user know that we are saving
  const [isSaving, setIsSaving] = useState(false);

  // listen for changes in state and do debounced saves to database
  useEffect(() => {
    async function saveToDatabase() {
      setIsSaving(true);
      setTimeout(async () => {
        // make request to save the data to the database
        // TODO: write middleware that converts the raw text into whatever components we need for the backend (e.g., scripts that are triggered; follow-ups that are scheduled)
        console.log('saving to database', soapData);

        let dataToSave = {
          date: soapNoteInfo.sigDate,
          sigName: soapNoteInfo.sigName,
          sigAbbreviation: soapNoteInfo.sigAbbreviation,
          subjective: soapData.subjective,
          objective: soapData.objective,
          assessment: soapData.assessment,
          plan: soapData.plan,
          priorContext: soapData.priorContext,
          notedAssessments: [],
          followUpContext: [],
        };

        console.log('data to save', dataToSave);
        console.log('data to save', JSON.stringify(dataToSave));

        try {
          const res = await fetch(`/api/soap/${soapNoteInfo.id}`, {
            method: 'PUT',
            body: JSON.stringify(dataToSave),
            headers: {
              'Content-Type': 'application/json',
            },
          });

          // TODO: last update date isn't working
          // Update the local data without a revalidation
          const { data } = await res.json();
          mutate(`/api/soap/${soapNoteInfo.id}`, data, false);
        } catch (err) {
          console.log(err);
        }

        setIsSaving(false);
      }, 1000);
    }

    saveToDatabase();
  }, [soapData, soapNoteInfo]);

  // sections of the soap notes
  const sections = [
    {
      name: 'subjective',
      title: 'S - Subjective observations from student report',
    },
    {
      name: 'objective',
      title: 'O - Objective data corresponding with students assessment',
    },
    {
      name: 'assessment',
      title: 'A - Assessment of root causes or practices',
    },
    {
      name: 'plan',
      title: 'P - Plan for Follow-Ups',
    },
  ];

  return (
    <>
      <div className="container m-auto grid grid-cols-2 gap-x-5 gap-y-5 auto-rows-auto w-3/4">
        <div className="col-span-2">
          <Link href="/">
            <a>
              <h3 className="text-md text-blue-600 hover:text-blue-800 visited:text-purple-600">
                &#8592; Back
              </h3>
            </a>
          </Link>
        </div>
        <div className="col-span-2">
          <h1 className="font-bold text-3xl">
            {soapNoteInfo.sigName} SIG | {soapNoteInfo.sigDate}
          </h1>
          <h2 className="font-bold text-lg">
            Last Updated: {soapNoteInfo.lastUpdated}
            <span className="italic text-blue-400">
              {isSaving ? ' Saving...' : ''}
            </span>
          </h2>
          <div></div>
        </div>

        {/* Context for SOAP Note
        <div className="w-full col-span-2">
          <h1 className="font-bold text-2xl border-b  border-black mb-3">
            Tracked Context for this SIG
          </h1>
          <div className="grid grid-cols-2">
            <div className="col-span-1">
              <h2 className="font-bold text-xl">Orchestration Scripts</h2>
              <p>Scripts</p>
            </div>
            <div className="col-span-1">
              <h2 className="font-bold text-xl">Previous SIG Meeting</h2>
              <p>Prior notes</p>
            </div>
          </div>
        </div> */}

        {/* Notes during SIG */}

        {/* Create a section for each component of the SOAP notes */}
        {/* resizing textbox: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */}
        {sections.map((section) => (
          <div
            className={`w-full ${
              ['assessment', 'plan'].includes(section.name)
                ? 'col-span-2'
                : 'col-span-1'
            }`}
            key={section.name}
          >
            <h1 className="font-bold text-xl">{section.title}</h1>

            <div className="">
              <TextBox
                value={soapData[section.name]}
                triggers={Object.keys(
                  autocompleteTriggersOptions[section.name]
                )}
                options={autocompleteTriggersOptions[section.name]}
                onChange={(edits) => {
                  setSoapData((prevSoapData) => {
                    let newSoapData = { ...prevSoapData };
                    newSoapData[section.name] = edits;
                    return newSoapData;
                  });
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// use serverside rendering to generate this page
export const getServerSideProps: GetServerSideProps = async (query) => {
  // get the sig name and date from the query
  let [sigAbbrev, date] = (query.params?.id as string).split('_');

  // fetch SOAP note for the given sig and date
  const currentSoapNote = await fetchSoapNote(sigAbbrev, date);
  console.log(currentSoapNote);

  // fetch data for this specific soap note
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

  const soapNoteInfo = {
    id: currentSoapNote.id,
    sigName: currentSoapNote.sigName,
    sigAbbreviation: currentSoapNote.sigAbbreviation,
    sigDate: longDate(currentSoapNote.date),
    lastUpdated: longDate(currentSoapNote.lastUpdated),
  };

  // setup the page with the data from the database
  // TODO: populate view with the following
  // - list of tracked practices and when they last occurred
  // - new work needs to address this week
  // - Subjective: student self-reflections on how the week went
  // - Objective: orchestration scripts that monitor for work practices
  const data = {
    priorContext: currentSoapNote.priorContext,
    subjective: currentSoapNote.subjective,
    objective: currentSoapNote.objective,
    assessment: currentSoapNote.assessment,
    plan: currentSoapNote.plan,
  };

  // setup triggers and options for each section's text boxes
  // TODO: have controllers that abstract this
  const autocompleteTriggersOptions = {
    subjective: {},
    objective: {},
    assessment: {
      '#': [
        'planning/risk-assessment',
        'planning/stories',
        'planning/deliverables',
        'planning/tasks',
      ],
    },
    plan: {
      '[script]': [
        ' at office hours, ________',
        ' at studio, ________',
        ' morning of office hours, ________',
        ' morning of studio, ________',
      ],
      '[follow-up]': [' follow-up template at next SIG meeting'],
    },
  };

  return {
    props: { soapNoteInfo, data, autocompleteTriggersOptions },
  };
};
