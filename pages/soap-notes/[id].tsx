import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState, useRef } from 'react';

import TextBox from '../../components/TextBox';
import IssuePane from '../../components/IssuePane';
import Link from 'next/link';
import { fetchSoapNote } from '../../controllers/soapNotes/fetchSoapNotes';
import { mutate } from 'swr';
import { SOAPStruct, IssueStruct } from '../../models/SOAPModel';
import Head from 'next/head';
import { longDate, shortDate } from '../../lib/helperFns';
import IssueCard from '../../components/IssueCard';
import IssueFromHighlight from '../../components/IssueFromHighlight';

export default function SOAPNote({
  soapNoteInfo,
  data,
  autocompleteTriggersOptions
}): JSX.Element {
  // have state for soap note data
  const [noteInfo, setNoteInfo] = useState(soapNoteInfo);

  // hold data from the current soap notes
  const [soapData, setSoapData] = useState(data);

  // hold a state for which issue is selected
  const [selectedIssue, setSelectedIssue] = useState(null);

  // hold a state for highlighted text
  const [highlightedText, setHighlightedText] = useState({
    visibility: 'hidden',
    section: '',
    highlightedContent: ''
  });

  // let user know that we are saving
  const [isSaving, setIsSaving] = useState(false);

  // hold a ref that checks if first load
  const firstLoad = useRef(true);

  // listen for changes in state and do debounced saves to database
  useEffect(() => {
    // don't save on first load
    if (firstLoad.current) {
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
      // TODO: need to repeat this on every issue
      for (let issue of soapData.issues) {
        // parse individual lines of the plan for the current issue
        let lines = issue.plan.split('\n');
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

        issue.followUpPlans = output;
      }

      let dataToSave = {
        project: soapNoteInfo.project,
        date: soapNoteInfo.sigDate,
        lastUpdated: lastUpdated,
        sigName: soapNoteInfo.sigName,
        sigAbbreviation: soapNoteInfo.sigAbbreviation,
        subjective: soapData.subjective ?? '',
        objective: soapData.objective ?? '',
        assessment: soapData.assessment ?? '',
        plan: soapData.plan ?? '',
        issues: soapData.issues,
        priorContext: soapData.priorContext,
        notedAssessments: [],
        followUpContext: {}
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
        console.error('Error in saving SOAP note: ', err);
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
  const diagnosisSections = [
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

  const summarySections = [
    {
      name: 'summary',
      title: 'Summary of issue'
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
      <div className="container m-auto grid grid-cols-3 gap-x-5 gap-y-5 auto-rows-auto w-2/3 mt-3">
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
        {/* <div className="w-full col-span-2">
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
          </div>
        </div> */}

        {/* Issue Cards and SOAP Notes*/}
        <div className="w-full col-span-2">
          <div>
            <h1 className="font-bold text-2xl border-b border-black mb-3">
              Tracked Issues
            </h1>
            <p className="italic">
              Click on an issue to view its details and write follow-up
              practices.
            </p>
            <div className="flex flex-wrap">
              {soapData.issues.map((issue, i) => (
                <IssueCard
                  key={`issue-card-index-${i}`}
                  issueId={i} // TODO: make this an id
                  title={issue.title}
                  lastUpdated={noteInfo.lastUpdated}
                  followUpPlans={issue.followUpPlans}
                  selectedIssue={selectedIssue}
                  setSelectedIssue={setSelectedIssue}
                />
              ))}
            </div>
          </div>

          {/* Notes during SIG */}
          {/* Create a section for each component of the SOAP notes */}
          {/* resizing textbox: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */}
          <div>
            <h1 className="font-bold text-2xl border-b border-black mb-3">
              This week&apos;s notes
            </h1>
            <p className="italic">
              Write notes from the SIG meeting below. To track issues from your
              notes, highlight the text and click the button that pops up below.
            </p>
            <IssueFromHighlight
              visibility={highlightedText.visibility}
              section={highlightedText.section}
              highlightedContent={highlightedText.highlightedContent}
              onClick={(section, highlightedContent) => {
                setSoapData((prevSoapData) => {
                  let newSoapData = { ...prevSoapData };
                  newSoapData.issues.push({
                    title: section.includes('assessment')
                      ? highlightedContent
                      : '',
                    subjective: '',
                    objective: '',
                    assessment: '',
                    plan: '',
                    summary: !section.includes('assessment')
                      ? highlightedContent
                      : '',
                    followUpPlans: []
                  });
                  return newSoapData;
                });
              }}
            />
            {diagnosisSections.map((section) => (
              <div className={`w-full`} key={section.name}>
                <h1 className="font-bold text-xl">{section.title}</h1>
                {section.name === 'plan' && (
                  <h2 className="text-sm color-grey">
                    Add plans for Orchestration Engine to follow-up on by
                    typing, &quot;[script]&quot;. These will be sent to the
                    students&apos; project channel.
                  </h2>
                )}

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
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = edits;
                      return newSoapData;
                    });
                  }}
                  onMouseUp={(e) => {
                    // get the section of text that was highlighted
                    let selection = window.getSelection();
                    let selectedText = selection.toString();
                    let range = selection.getRangeAt(0);
                    let boundingRect = range.getBoundingClientRect();
                    let soapSection = section.name;

                    // check if nothing is highlighted
                    if (selectedText === '') {
                      setHighlightedText((prevHighlightedText) => ({
                        ...prevHighlightedText,
                        visibility: 'hidden',
                        section: '',
                        highlightedContent: ''
                      }));
                      return;
                    } else {
                      // set state variable for highlighted text
                      setHighlightedText({
                        visibility: 'visible',
                        section: soapSection,
                        highlightedContent: selectedText
                      });
                    }

                    // TODO: create a component and set the left, top, visibility, and data using state https://stackoverflow.com/questions/63738841/how-to-show-popup-on-text-highlight-at-the-middle-of-the-selection

                    console.log(soapSection, selectedText, range);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Issue Pane */}
        <div className="w-full col-span-1">
          <div>
            {selectedIssue !== null && (
              <>
                <h1 className="font-bold text-2xl border-b border-black mb-3">
                  Selected Issue
                </h1>
                <IssuePane
                  issueIndex={selectedIssue}
                  title={soapData.issues[selectedIssue].title}
                  diagSections={diagnosisSections}
                  summarySections={summarySections}
                  autocompleteTriggersOptions={autocompleteTriggersOptions}
                  soapData={{
                    subjective: soapData.issues[selectedIssue].subjective,
                    objective: soapData.issues[selectedIssue].objective,
                    assessment: soapData.issues[selectedIssue].assessment,
                    plan: soapData.issues[selectedIssue].plan,
                    summary: soapData.issues[selectedIssue].summary,
                    followUpPlans: soapData.issues[selectedIssue].followUpPlans
                  }}
                  setSoapData={setSoapData} // TODO: this needs to be per issue
                />
              </>
            )}
          </div>
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
  // TODO: see how I can add type checking to this
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
    console.error(err);
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
    console.error(err);
  }

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
    subjective: currentSoapNote.subjective,
    objective: currentSoapNote.objective,
    assessment: currentSoapNote.assessment,
    plan: currentSoapNote.plan,
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
  // check if title doesn't match any existing issue titles
  // TODO: should have the context from what triggered the script injected into the issue object
  // TODO: having to recurisvely strip obj id's for some reason...
  let noteIssues = currentSoapNote.toObject().issues;
  noteIssues = noteIssues.map((issue) => {
    return {
      title: issue.title,
      subjective: issue.subjective,
      objective: issue.objective,
      assessment: issue.assessment,
      plan: issue.plan,
      summary: issue.summary,
      followUpPlans: issue.followUpPlans.map((followup) => {
        return {
          venue: followup.venue,
          strategy: followup.strategy
        };
      })
    };
  });

  for (let script of triggeredScripts) {
    let title = `[detected issue] ${script.name} - ${script.strategies}`;
    let titleIndex = noteIssues.findIndex((issue) => issue.title === title);

    if (titleIndex === -1) {
      noteIssues.push({
        title: title,
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        summary: '',
        followUpPlans: []
      });
    }
  }

  // sort noteIssues by [detected issues] first
  noteIssues.sort((a, b) => {
    if (a.title.includes('[detected issue]')) {
      return -1;
    } else {
      return 1;
    }
  });

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
      triggeredScripts: [],
      followUpPlans: 'none'
    },
    issues: noteIssues,
    subjective: soapNoteInfo.subjective,
    objective: soapNoteInfo.objective,
    assessment: soapNoteInfo.assessment,
    plan: soapNoteInfo.plan
  };

  // setup triggers and options for each section's text boxes
  // TODO: have controllers that abstract this
  const autocompleteTriggersOptions = {
    summary: {},
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
        ' morning of office hours: ', // TODO: detect this properly
        ' at office hours: ',
        ' after SIG: ',
        ' day after SIG: ',
        ' morning of next SIG: ',
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
