//index.tsx
import { OutputData } from '@editorjs/editorjs';
import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import TextBox from '../components/TextBox';

// important that we use dynamic loading here
// editorjs should only be rendered on the client side.
// const EditorBlock = dynamic(() => import("../components/Editor"), {
//   ssr: false,
// });

export default function Home({
  data,
  autocompleteTriggersOptions,
}): JSX.Element {
  // hold data from the current soap notes
  const [soapData, setSoapData] = useState(data);

  // let user know that we are saving
  const [isSaving, setIsSaving] = useState(false);

  // listen for changes in state and do debounced saves to database
  useEffect(() => {
    setIsSaving(true);
    // TODO: debounce the save
    const timeout = setTimeout(() => {
      // make request to save the data to the database
      // TODO: write middleware that converts the raw text into whatever components we need for the backend (e.g., scripts that are triggered; follow-ups that are scheduled)
      console.log('saving to database', soapData);
      setIsSaving(false);
    }, 1000);
  }, [soapData]);

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
        <div className="col-span-2 ">
          <h1 className="font-bold text-4xl">SOAP Notes -- SIG Name, Date</h1>
          <div></div>
        </div>

        {/* Section for tracked practices */}
        <div className="w-full col-span-2">
          <h1 className="font-bold text-xl">
            T - Tracked Practices (if applicable)
          </h1>
        </div>

        {/* Create a section for each component of the SOAP notes */}
        {/* resizing textbox: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */}
        {sections.map((section) => (
          <div
            className={`w-full ${
              ['assessment', 'plan'].includes(section.name) ? 'col-span-2' : ''
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
export const getServerSideProps = async () => {
  // setup the page with the data from the database
  // TODO: populate view with the following
  // - list of tracked practices and when they last occurred
  // - new work needs to address this week
  // - Subjective: student self-reflections on how the week went
  // - Objective: orchestration scripts that monitor for work practices
  const data = {
    subjective: 'test content for subjective',
    objective: 'test content for objective',
    assessment: 'test content for assessment',
    plan: 'test content for plan',
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
        ' script tempalate for project',
        ' script template for people',
      ],
      '[follow-up]': [' follow-up template at next SIG meeting'],
    },
  };

  return {
    props: { data, autocompleteTriggersOptions },
  };
};
