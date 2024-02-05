import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState } from 'react';

import TextBox from '../../components/TextBox';
import Link from 'next/link';
import { fetchSoapNote } from '../../controllers/soapNotes/fetchSoapNotes';
import { mutate } from 'swr';
import { SOAP } from '../../models/SOAPModel';

const longDate = (date) => {
  return date.toLocaleDateString('en-us', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
};

export default function SOAPNote({
  soapNoteInfo,
  data,
  autocompleteTriggersOptions,
}): JSX.Element {
  // have state for soap note data
  const [noteInfo, setNoteInfo] = useState(soapNoteInfo);

  // hold data from the current soap notes
  const [soapData, setSoapData] = useState(data);

  // let user know that we are saving
  const [isSaving, setIsSaving] = useState(false);

  // listen for changes in state and do debounced saves to database
  useEffect(() => {
    setIsSaving(true);
    const timeOutId = setTimeout(async () => {
      // make request to save the data to the database
      // TODO: write middleware that converts the raw text into whatever components we need for the backend (e.g., scripts that are triggered; follow-ups that are scheduled)
      // console.log('saving to database', soapData);

      // TODO: parse the follow-up scripts into a request
      // TODO: check if active issue is already in Orchestration Scripts before recreating
      // split into lines
      // TODO: make sure OS rejects poorly formed scripts
      let lines = soapData.plan.split('\n');

      // check if any lines have a [script] tag
      let scripts = lines.filter((line) => line.includes('[script]'));

      // create objects for each script
      let output = [];
      for (let script of scripts) {
        // check if the script is fully written before adding it to output
        let splitFollowUp = script.split('[script]')[1].split(':');
        if (
          splitFollowUp.length < 2 ||
          splitFollowUp[1].trim() === '[follow-up to send]'
        ) {
          continue;
        } else {
          let [venue, strategy] = splitFollowUp;
          output.push({
            venue: venue.trim(),
            strategy: strategy.trim(),
          });
        }
      }

      let dataToSave = {
        project: soapNoteInfo.project,
        date: soapNoteInfo.sigDate,
        sigName: soapNoteInfo.sigName,
        sigAbbreviation: soapNoteInfo.sigAbbreviation,
        subjective: soapData.subjective,
        objective: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
        priorContext: soapData.priorContext,
        notedAssessments: [],
        followUpContext: output,
      };

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

      setNoteInfo((prevNoteInfo) => ({
        ...prevNoteInfo,
        lastUpdated: longDate(new Date()),
      }));

      setIsSaving(false);
    }, 5000);

    return () => clearTimeout(timeOutId);
  }, [soapData, soapNoteInfo]);

  // sections of the soap notes
  const sections = [
    {
      name: 'subjective',
      title: 'Additional Context from Mentor',
    },
    // {
    //   name: 'objective',
    //   title: 'O - Objective data corresponding with students assessment',
    // },
    {
      name: 'assessment',
      title: 'Assessment of root causes or practices',
    },
    {
      name: 'plan',
      title: 'Plan for Follow-Ups',
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
            {noteInfo.project} | {noteInfo.sigDate}
          </h1>
          <h2 className="font-bold text-lg">
            Last Updated: {noteInfo.lastUpdated}
            <span className="italic text-blue-400">
              {isSaving ? ' Saving...' : ''}
            </span>
          </h2>
          <div></div>
        </div>

        {/* Context for SOAP note */}
        <div className="w-full col-span-2">
          <h1 className="font-bold text-2xl border-b  border-black mb-3">
            Tracked Context During the Week
          </h1>
          <div className="grid grid-cols-2">
            <div className="col-span-1">
              <h2 className="font-bold text-xl">Tool data</h2>
              <h3 className="font-bold text-lg">Sprint Log</h3>
              <p>
                {soapData.priorContext.tracked === undefined
                  ? 'no context from tools'
                  : soapData.priorContext.tracked.map((str, i) => (
                      <p key={i}>{str}</p>
                    ))}
              </p>
            </div>

            <div className="col-span-1">
              <h2 className="font-bold text-xl">
                Detected Issues from Orchestration Engine
              </h2>
              <p>
                {soapData.priorContext.triggeredScripts === undefined
                  ? 'no detected issuess'
                  : soapData.priorContext.triggeredScripts.map((str, i) => (
                      <p key={i}>{str}</p>
                    ))}
              </p>
            </div>
            {/* <div className="col-span-1">
              <h2 className="font-bold text-xl">Follow-up plans</h2>
              <p>
                {soapData.priorContext.followUpPlans === undefined
                  ? 'none'
                  : soapData.priorContext.followUpPlans
                      .split('\n')
                      .map((str, i) => <p key={i}>{str}</p>)}
              </p>
            </div> */}
          </div>
        </div>

        {/* Notes during SIG */}
        {/* Create a section for each component of the SOAP notes */}
        {/* resizing textbox: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */}
        <div className="w-full col-span-2">
          <h1 className="font-bold text-2xl border-b  border-black mb-3">
            This week&apos;s notes
          </h1>
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
              {section.name === 'plan' && (
                <h2 className="text-sm color-grey">
                  Add plans for Orchestration Engine to follow-up on by typing,
                  &quot;[script]&quot;
                </h2>
              )}

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

          {/* Define actionable follow-ups a mentor can input
          <div>
            <h2 className="font-bold text-xl">Actionable follow-ups</h2>
            <select name="cars" id="cars">
              <option value="volvo">Volvo</option>
              <option value="saab">Saab</option>
              <option value="mercedes">Mercedes</option>
              <option value="audi">Audi</option>
            </select>
          </div> */}
        </div>
      </div>
    </>
  );
}

// use serverside rendering to generate this page
export const getServerSideProps: GetServerSideProps = async (query) => {
  // get the sig name and date from the query
  let [sigAbbrev, project, date] = (query.params?.id as string).split('_');

  // fetch SOAP note for the given sig and date
  const currentSoapNote = await fetchSoapNote(sigAbbrev, project, date);

  // fetch contextual data from OS
  let contextualData;
  try {
    const res = await fetch(
      'http://localhost:5001/organizationalObjects/getComputedOrganizationalObjectsForProject',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName: currentSoapNote.project }),
      }
    );

    contextualData = await res.json();
  } catch (err) {
    console.log(err);
  }

  // TODO: get active scripts from OS
  let activeScripts;
  try {
    const res = await fetch(
      'http://localhost:5001/activeIssues/fetchActiveIssuesForProject?' +
        new URLSearchParams({
          projectName: currentSoapNote.project,
        })
    );
    activeScripts = await res.json();
  } catch (err) {
    console.log(err);
  }
  console.log(activeScripts);

  const triggeredScripts = activeScripts.map((script) => {
    return {
      name: script.name,
      strategies: script.computed_strategies[0].outlet_args.message,
    };
  });

  // fetch data for this specific soap note
  const soapNoteInfo = {
    id: currentSoapNote.id,
    project: currentSoapNote.project,
    sigName: currentSoapNote.sigName,
    sigAbbreviation: currentSoapNote.sigAbbreviation,
    sigDate: longDate(currentSoapNote.date),
    lastUpdated: longDate(currentSoapNote.lastUpdated),
  };

  // setup tracked data
  let sprintStories = contextualData.project.tools.sprintLog.stories.map(
    (story) => {
      return `[planned story] ${story.description}`;
    }
  );

  let sprintPoints = contextualData.project.tools.sprintLog.points.map(
    (pointsForPerson) => {
      return `[points summary] ${pointsForPerson.name}: ${pointsForPerson.pointsCommitted.total} committed of ${pointsForPerson.pointsAvailable} available`;
    }
  );

  // setup tracked scripts
  let trackedScripts = triggeredScripts.map((script) => {
    return `[detected issue] ${script.name} - ${script.strategies}`;
  });
  if (trackedScripts.length === 0) {
    trackedScripts = ['no detected issues'];
  }

  // setup the page with the data from the database
  // TODO: populate view with the following
  // - list of tracked practices and when they last occurred
  // - new work needs to address this week
  // - Subjective: student self-reflections on how the week went
  // - Objective: orchestration scripts that monitor for work practices
  const data = {
    priorContext: {
      tracked: [].concat(sprintPoints, sprintStories),
      triggeredScripts: trackedScripts,
      followUpPlans: 'none',
    },
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
        ' at office hours: [follow-up to send]',
        ' at studio: [follow-up to send]',
        ' morning of office hours: [follow-up to send]',
        ' morning of studio: [follow-up to send]',
        ' day after SIG: [follow-up to send]',
      ],
      '[follow-up]': [' follow-up template at next SIG meeting'],
    },
  };

  return {
    props: { soapNoteInfo, data, autocompleteTriggersOptions },
  };
};
