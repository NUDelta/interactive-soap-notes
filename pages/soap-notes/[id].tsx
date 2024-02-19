import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState, useRef } from 'react';

import TextBox from '../../components/TextBox';
import Link from 'next/link';
import { fetchSoapNote } from '../../controllers/soapNotes/fetchSoapNotes';
import { mutate } from 'swr';
import { SOAP } from '../../models/SOAPModel';
import Head from 'next/head';
import { longDate, shortDate } from '../../lib/helperFns';

export default function SOAPNote({
  soapNoteInfo,
  data,
  autocompleteTriggersOptions
}): JSX.Element {
  // have state for soap note data
  const [noteInfo, setNoteInfo] = useState(soapNoteInfo);

  // hold data from the current soap notes
  const [soapData, setSoapData] = useState(data);

  // let user know that we are saving
  const [isSaving, setIsSaving] = useState(false);

  // hold a ref that checks if first load
  const firstLoad = useRef(true);

  // listen for changes in state and do debounced saves to database
  useEffect(() => {
    // don't save on first load
    if (firstLoad.current) {
      console.log('first load');
      firstLoad.current = false;
      return;
    }

    setIsSaving(true);
    const timeOutId = setTimeout(async () => {
      // make request to save the data to the database
      // TODO: write middleware that converts the raw text into whatever components we need for the backend (e.g., scripts that are triggered; follow-ups that are scheduled)
      // console.log('saving to database', soapData);

      // TODO: parse the follow-up scripts into a request
      // TODO: check if active issue is already in Orchestration Scripts before recreating
      // split into lines
      // TODO: make sure OS rejects poorly formed scripts -- doing this already, but make sure the user knows the script was rejected
      // TODO: show when the script would execute

      // hold a last updated timestamp
      const lastUpdated = new Date();

      // check if any lines have a [script] tag
      let lines = soapData.plan.split('\n');
      let scripts = lines.filter((line) => line.includes('[script]'));

      // create objects for each script
      let output = [];
      for (let script of scripts) {
        // check if the script is fully written before adding it to output
        let splitFollowUp = script.split('[script]')[1].split(':');
        if (
          splitFollowUp.length < 2 ||
          splitFollowUp[1].trim() === '[follow-up to send]' ||
          splitFollowUp[1].trim() === ''
        ) {
          continue;
        } else {
          let [venue, strategy] = splitFollowUp;
          output.push({
            venue: venue.trim(),
            strategy: strategy.trim()
          });
        }
      }

      let dataToSave = {
        project: soapNoteInfo.project,
        date: soapNoteInfo.sigDate,
        lastUpdated: lastUpdated,
        sigName: soapNoteInfo.sigName,
        sigAbbreviation: soapNoteInfo.sigAbbreviation,
        subjective: soapData.subjective,
        objective: soapData.objective,
        assessment: soapData.assessment,
        plan: soapData.plan,
        priorContext: soapData.priorContext,
        notedAssessments: [],
        followUpContext: output
      };

      try {
        const res = await fetch(`/api/soap/${soapNoteInfo.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave),
          headers: {
            'Content-Type': 'application/json'
          }
        });

        // TODO: last update date isn't working
        // TODO: why am i doing this lol?
        // Update the local data without a revalidation
        const { data } = await res.json();
        mutate(`/api/soap/${soapNoteInfo.id}`, data, false);
      } catch (err) {
        console.log(err);
      }

      setNoteInfo((prevNoteInfo) => ({
        ...prevNoteInfo,
        lastUpdated: longDate(lastUpdated, true)
      }));

      setIsSaving(false);
    }, 5000);

    return () => clearTimeout(timeOutId);
  }, [soapData, soapNoteInfo]);

  // sections of the soap notes
  const sections = [
    {
      name: 'subjective',
      title: 'Subjective information from student(s)'
    },
    {
      name: 'objective',
      title: 'Objective information matching student(s) summary'
    },
    {
      name: 'assessment',
      title:
        'Assessment of situation (e.g., obstacles to practice; metacogntive blockers)'
    },
    {
      name: 'plan',
      title: 'Plan for follow-up and check-ins'
    }
  ];

  return (
    <>
      {/* Set title of the page to be project name */}
      <Head>
        <title>{noteInfo.project}</title>
      </Head>

      {/* Header info for SOAP note */}
      <div className="container m-auto grid grid-cols-2 gap-x-5 gap-y-5 auto-rows-auto w-3/4">
        <div className="col-span-2">
          <Link href="/">
            <h3 className="text-md text-blue-600 hover:text-blue-800 visited:text-purple-600">
              &#8592; Back
            </h3>
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
        {/* TODO: make this generate from an object instead of pre-defining sections (tool data, sprint) */}
        <div className="w-full col-span-2">
          <h1 className="font-bold text-2xl border-b  border-black mb-3">
            Tracked Context
          </h1>
          <div className="grid grid-cols-2">
            <div className="col-span-1">
              <h2 className="font-bold text-xl">Sprint Log</h2>
              {soapData.priorContext.tracked === undefined ? (
                <p>no context from tools</p>
              ) : (
                soapData.priorContext.tracked.map((str, i) => (
                  <p key={i}>
                    {str}
                    <br></br>
                  </p>
                ))
              )}
            </div>

            {/* <div className="col-span-1">
            <h2 className="font-bold text-xl">
              Detected Issues from Orchestration Engine
            </h2>
            {soapData.priorContext.triggeredScripts === undefined ? (
              <p>no detected issues</p>
            ) : (
              soapData.priorContext.triggeredScripts.map((str, i) => (
                <p key={i}>
                  {str}
                  <br></br>
                </p>
              ))
            )}
          </div> */}
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
                  &quot;[script]&quot;. These will be sent to the students&apos;
                  project channel.
                </h2>
              )}

              <div className="">
                {/* TODO: abstract out the update code */}
                <TextBox
                  value={soapData[section.name]}
                  triggers={Object.keys(
                    autocompleteTriggersOptions[section.name]
                  )}
                  options={autocompleteTriggersOptions[section.name]}
                  onFocus={(e) => {
                    // add a "- " if the text box is empty
                    if (e.target.value === '') {
                      setSoapData((prevSoapData) => {
                        let newSoapData = { ...prevSoapData };
                        newSoapData[section.name] = '- ';
                        return newSoapData;
                      });
                    }
                  }}
                  onBlur={(e) => {
                    // remove the dash if the text box is empty
                    if (e.target.value.trim() === '-') {
                      setSoapData((prevSoapData) => {
                        let newSoapData = { ...prevSoapData };
                        newSoapData[section.name] = '';
                        return newSoapData;
                      });
                    }
                  }}
                  onKeyUp={(e) => {
                    // add a new line to the text box with a dash when the user presses enter
                    if (e.key === 'Enter') {
                      // check if it's not a script line
                      let lines = e.target.value.split('\n');
                      if (
                        lines.length >= 1 &&
                        lines[lines.length - 1].includes('[script]')
                      ) {
                        return;
                      }

                      setSoapData((prevSoapData) => {
                        let newSoapData = { ...prevSoapData };
                        newSoapData[section.name] = `${e.target.value}- `;
                        return newSoapData;
                      });
                    }
                  }}
                  onChange={(edits) => {
                    // update the state with the new data
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
      `${process.env.ORCH_ENGINE}/organizationalObjects/getComputedOrganizationalObjectsForProject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectName: currentSoapNote.project })
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
      `${
        process.env.ORCH_ENGINE
      }/activeIssues/fetchActiveIssuesForProject?${new URLSearchParams({
        projectName: currentSoapNote.project
      })}`
    );
    activeScripts = await res.json();
  } catch (err) {
    console.log(err);
  }
  console.log(activeScripts);

  const triggeredScripts = activeScripts.map((script) => {
    return {
      name: script.name,
      strategies: script.computed_strategies[0].outlet_args.message
    };
  });

  // fetch data for this specific soap note
  const soapNoteInfo = {
    id: currentSoapNote.id,
    project: currentSoapNote.project,
    sigName: currentSoapNote.sigName,
    sigAbbreviation: currentSoapNote.sigAbbreviation,
    sigDate: shortDate(currentSoapNote.date),
    lastUpdated: longDate(currentSoapNote.lastUpdated, true)
  };

  // setup tracked data
  let sprintStories;
  try {
    sprintStories = contextualData.project.tools.sprintLog.stories.map(
      (story) => {
        return `- ${story.description}`;
      }
    );
  } catch (err) {
    sprintStories = ['unable to fetch sprint stories'];
  }

  let sprintPoints;
  try {
    sprintPoints = contextualData.project.tools.sprintLog.points.map(
      (pointsForPerson) => {
        return `- ${pointsForPerson.name}: ${pointsForPerson.pointsCommitted.total} points out of ${pointsForPerson.pointsAvailable} committed; ${pointsForPerson.hoursSpent.total} hours spent`;
      }
    );
  } catch (err) {
    sprintPoints = ['unable to fetch sprint points'];
  }

  // setup tracked scripts
  let trackedScripts = triggeredScripts.map((script) => {
    return `- [detected issue] ${script.name} - ${script.strategies}`;
  });
  // if (trackedScripts.length === 0) {
  //   trackedScripts = ['no detected issues'];
  // }

  // create a text object with scripts added before objective
  let objectiveTextList = currentSoapNote.objective.split('\n');
  let filteredObjectiveTextList = objectiveTextList.filter(
    (line) => !line.includes('[detected issue]')
  );
  let objectiveText = trackedScripts
    .concat(filteredObjectiveTextList)
    .join('\n')
    .trim();
  console.log(objectiveText);

  // setup the page with the data from the database
  // TODO: populate view with the following
  // - list of tracked practices and when they last occurred
  // - new work needs to address this week
  // - Subjective: student self-reflections on how the week went
  // - Objective: orchestration scripts that monitor for work practices
  const data = {
    priorContext: {
      tracked: [].concat(
        ['Point Summary'],
        sprintPoints,
        ['Sprint Stories'],
        sprintStories
      ),
      triggeredScripts: trackedScripts,
      followUpPlans: 'none'
    },
    subjective: currentSoapNote.subjective,
    objective: objectiveText,
    assessment: currentSoapNote.assessment,
    plan: currentSoapNote.plan
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
        'planning/tasks'
      ]
    },
    plan: {
      '[script]': [
        // ' morning of office hours: [follow-up to send]', TODO: detect this properly
        // ' at office hours: [follow-up to send]',
        ' after SIG: ',
        ' day after SIG: ',
        ' morning of studio: ',
        ' at studio: ',
        ' after studio: '
      ],
      '[follow-up]': [' follow-up template at next SIG meeting']
    }
  };

  return {
    props: { soapNoteInfo, data, autocompleteTriggersOptions }
  };
};
