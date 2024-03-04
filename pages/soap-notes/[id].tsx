import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import mongoose from 'mongoose';
import { mutate } from 'swr';

import { fetchSoapNote } from '../../controllers/soapNotes/fetchSoapNotes';
import TextBox from '../../components/TextBox';
import IssueCard from '../../components/IssueCard';
import IssuePane from '../../components/IssuePane';
import IssueFromHighlight from '../../components/IssueFromHighlight';
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
      title: 'Plan for practices and check-ins'
    }
  ];

  const summarySections = [
    {
      name: 'context',
      title: 'Context of issue instance'
    },
    {
      name: 'summary',
      title: 'Summary of issue instance'
    },
    {
      name: 'plan',
      title: 'Plan for practices and check-ins'
    }
  ];

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

      // check if any lines have a [practice] tag
      // TODO: 03-03-24: apply this logic to the current issue instance (though might not be needed if follow-ups become clickable components)
      for (let issue of soapData.issues) {
        // check if current instance is not null
        if (issue.currentInstance === null) {
          continue;
        }

        // parse follow-ups plans for each current issue instance
        let lines = issue.currentInstance.plan.split('\n');
        let scripts = lines.filter((line) => line.includes('[practice]'));

        // create objects for each script
        let output = [];
        for (let script of scripts) {
          // check if the script is fully written before adding it to output
          let splitFollowUp = script.split('[practice]')[1].split(':');
          if (
            splitFollowUp.length < 2 ||
            splitFollowUp[1].trim() === '[follow-up to send]' ||
            splitFollowUp[1].trim() === ''
          ) {
            continue;
          } else {
            let [venue, strategy] = splitFollowUp;
            output.push({
              practice: strategy.trim(),
              opportunity: venue.trim(),
              person: 'students',
              activeIssueId: ''
            });
          }
        }

        issue.currentInstance.practices = output;
      }

      let dataToSave = {
        project: soapNoteInfo.project,
        date: soapNoteInfo.sigDate,
        lastUpdated: lastUpdated,
        sigName: soapNoteInfo.sigName,
        sigAbbreviation: soapNoteInfo.sigAbbreviation,
        subjective: soapData.subjective ?? [],
        objective: soapData.objective ?? [],
        assessment: soapData.assessment ?? [],
        plan: soapData.plan ?? [],
        issues: soapData.issues ?? [],
        priorContext: soapData.priorContext ?? {}
      };

      try {
        const res = await fetch(`/api/soap/${soapNoteInfo.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave),
          headers: {
            'Content-Type': 'application/json'
          }
        });

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

  // return the page
  return (
    <>
      {/* Set title of the page to be project name */}
      <Head>
        <title>{noteInfo.project}</title>
      </Head>

      {/* Header info for SOAP note */}
      {/* TODO: 03-03-24 -- have side pane continue downwards past this week's notes. one way to do it would be have a separate grid for just the issue pane instead of it being embdedded here */}
      <div className="container m-auto grid grid-cols-3 gap-x-5 gap-y-5 auto-rows-auto w-2/3 mt-3">
        {/* Back button */}
        <div className="col-span-2">
          <Link href="/">
            <h3 className="text-md text-blue-600 hover:text-blue-800 visited:text-purple-600">
              &#8592; Back
            </h3>
          </Link>
        </div>

        {/* Title and last updated */}
        <div className="col-span-3">
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
              {/* TODO: 03-03-24 -- get lastUpdated working */}
              {soapData.issues.map((issue) => (
                <IssueCard
                  key={`issue-card-${issue.id}`}
                  issueId={issue.id}
                  title={issue.title}
                  lastUpdated={issue.lastUpdated}
                  currentIssueInstance={issue.currentInstance}
                  selectedIssue={selectedIssue}
                  setSelectedIssue={setSelectedIssue}
                />
              ))}
            </div>
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
                  issueId={selectedIssue}
                  soapData={soapData}
                  setSoapData={setSoapData} // TODO: this needs to be per issue
                  summarySections={summarySections}
                  autocompleteTriggersOptions={autocompleteTriggersOptions}
                />
              </>
            )}
          </div>
        </div>

        {/* Notes during SIG */}
        {/* Create a section for each component of the SOAP notes */}
        {/* resizing textbox: https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/ */}
        <div className="w-full col-span-2">
          <h1 className="font-bold text-2xl border-b border-black mb-3">
            This week&apos;s notes
          </h1>
          <p className="italic">
            Write notes from the SIG meeting below. To track issues from your
            notes, highlight the text and click the button that pops up below.
          </p>

          {/* TODO: replace this with buttons for selected lines */}
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

          {/* Create a text box for each section of the SOAP note */}
          {diagnosisSections.map((section) => (
            <div className={`w-full`} key={section.name}>
              <h1 className="font-bold text-xl">{section.title}</h1>
              {section.name === 'plan' && (
                <h2 className="text-sm color-grey">
                  Add practices for Orchestration Engine to follow-up on by
                  typing, &quot;[practice]&quot;. These will be sent to the
                  students&apos; project channel.
                </h2>
              )}

              {/* TODO: abstract out the update code */}
              <TextBox
                value={soapData[section.name]
                  .map((line) => `${line.value}`)
                  .join('\n')}
                triggers={Object.keys(
                  autocompleteTriggersOptions[section.name]
                )}
                options={autocompleteTriggersOptions[section.name]}
                onFocus={(e) => {
                  // add a "- " if the text box is empty
                  if (e.target.value === '') {
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = [
                        ...newSoapData[section.name],
                        {
                          id: new mongoose.Types.ObjectId().toString(),
                          isChecked: false,
                          isInIssue: false,
                          type: 'note',
                          context: [],
                          value: '- '
                        }
                      ];
                      return newSoapData;
                    });
                  }
                }}
                onBlur={(e) => {
                  // remove the dash if the text box is empty
                  if (e.target.value.trim() === '-') {
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = [
                        ...newSoapData[section.name].slice(0, -1)
                      ];
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
                      lines[lines.length - 1].includes('[practice]')
                    ) {
                      return;
                    }

                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = [
                        ...newSoapData[section.name],
                        {
                          id: new mongoose.Types.ObjectId().toString(),
                          isChecked: false,
                          isInIssue: false,
                          type: 'note',
                          context: [],
                          value: '- '
                        }
                      ];
                      return newSoapData;
                    });
                  }
                }}
                onChange={(edits) => {
                  let lines = edits.split('\n');
                  // TODO: 03-03-24 -- this overwrites all the other info about isChecked and stuff -- need to fix update command once using div
                  let updatedLines = lines.map((line) => {
                    return {
                      id: new mongoose.Types.ObjectId().toString(),
                      isChecked: false,
                      isInIssue: false,
                      type: line.includes('[practice]') ? 'script' : 'note',
                      context: [],
                      value: line
                    };
                  });

                  // don't do an update if the last line is blank (onKeyUp handles that
                  if (lines[lines.length - 1] === '') {
                    return;
                  }

                  setSoapData((prevSoapData) => {
                    let newSoapData = { ...prevSoapData };
                    newSoapData[section.name] = updatedLines;
                    return newSoapData;
                  });
                }}
                // onMouseUp={(e) => {
                //   // get the section of text that was highlighted
                //   let selection = window.getSelection();
                //   let selectedText = selection.toString();
                //   let range = selection.getRangeAt(0);
                //   let boundingRect = range.getBoundingClientRect();
                //   let soapSection = section.name;

                //   // check if nothing is highlighted
                //   if (selectedText === '') {
                //     setHighlightedText((prevHighlightedText) => ({
                //       ...prevHighlightedText,
                //       visibility: 'hidden',
                //       section: '',
                //       highlightedContent: ''
                //     }));
                //     return;
                //   } else {
                //     // set state variable for highlighted text
                //     setHighlightedText({
                //       visibility: 'visible',
                //       section: soapSection,
                //       highlightedContent: selectedText
                //     });
                //   }

                //   // TODO: create a component and set the left, top, visibility, and data using state https://stackoverflow.com/questions/63738841/how-to-show-popup-on-text-highlight-at-the-middle-of-the-selection

                //   console.log(soapSection, selectedText, range);
                // }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// use serverside rendering to generate this page
export const getServerSideProps: GetServerSideProps = async (query) => {
  // get the sig name and date from the query
  let [sigAbbrev, project, date] = (query.params?.id as string).split('_');

  /**
   * fetch SOAP note for the given sig and date, and format for display
   */
  // TODO: see how I can add type checking to this
  let currentSoapNote = await fetchSoapNote(sigAbbrev, project, date);

  // remove id from text entry
  const stripIdFromTextEntry = (entry) => {
    return {
      id: entry.id.toString(),
      isChecked: entry.isChecked,
      isInIssue: entry.isInIssue,
      type: entry.type,
      context: entry.context.map((context) => {
        return {
          description: context.description,
          value: context.value
        };
      }),
      value: entry.value
    };
  };

  const stripIdFromPractice = (practice) => {
    return {
      id: practice.id.toString(),
      practice: practice.practice,
      opportunity: practice.opportunity,
      person: practice.person,
      activeIssueId: practice.activeIssueId
    };
  };

  // remove id from issues (and subissues)
  const stripIdFromIssue = (issue) => {
    return {
      id: issue.id.toString(),
      title: issue.title,
      description: issue.description,
      currentInstance:
        issue.currentInstance == null
          ? null
          : {
              id: issue.currentInstance.id.toString(),
              date: longDate(issue.currentInstance.date),
              context: issue.currentInstance.context,
              summary: issue.currentInstance.summary,
              plan: issue.currentInstance.plan,
              practices: issue.currentInstance.practices.map((practice) =>
                stripIdFromPractice(practice)
              )
            },
      priorInstances: issue.priorInstances.map((instance) => {
        return {
          id: instance.id.toString(),
          date: longDate(instance.date),
          context: instance.context,
          summary: instance.summary,
          plan: instance.plan,
          practices: instance.practices.map((practice) =>
            stripIdFromPractice(practice)
          )
        };
      }),
      lastUpdated: longDate(issue.lastUpdated),
      issueInactive: issue.issueInactive,
      issueArchived: issue.issueArchived
    };
  };

  // create data object for display
  const soapNoteInfo = {
    id: currentSoapNote.id,
    project: currentSoapNote.project,
    sigName: currentSoapNote.sigName,
    sigAbbreviation: currentSoapNote.sigAbbreviation,
    sigDate: shortDate(currentSoapNote.date),
    lastUpdated: longDate(currentSoapNote.lastUpdated, true),
    subjective: currentSoapNote.subjective.map((line) =>
      stripIdFromTextEntry(line)
    ),
    objective: currentSoapNote.objective.map((line) =>
      stripIdFromTextEntry(line)
    ),
    assessment: currentSoapNote.assessment.map((line) =>
      stripIdFromTextEntry(line)
    ),
    plan: currentSoapNote.plan.map((line) => stripIdFromTextEntry(line)),
    issues: currentSoapNote.issues
      .map((issue) => stripIdFromIssue(issue))
      .sort((a, b) => (a.lastUpdated > b.lastUpdated ? -1 : 1))
  };

  /**
   * fetch contextual data from OS
   */
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

  /**
   * get active issues from OS
   */
  let activeIssues;
  try {
    const res = await fetch(
      `${
        process.env.ORCH_ENGINE
      }/activeIssues/fetchActiveIssuesForProject?${new URLSearchParams({
        projectName: currentSoapNote.project
      })}`
    );
    activeIssues = await res.json();
  } catch (err) {
    console.error(err);
  }

  // TODO: 03-03-24 -- see if I can filter out actionable followups and get some context separately
  // get only issues and follow-ups for next SIG
  const triggeredScripts = activeIssues
    .filter(
      (issue) =>
        !issue.name.includes('actionable follow-up') ||
        (issue.name.includes('actionable follow-up') &&
          (issue.name.includes('morning of next SIG') ||
            issue.name.includes('at next SIG')))
    )
    .map((script) => {
      return {
        name: script.name,
        type: script.name.includes('follow-up') ? 'follow-up' : 'issue',
        strategies: script.computed_strategies[0].outlet_args.message
      };
    });

  // add active issues to SOAP notes
  for (let script of triggeredScripts) {
    let scriptType = '';
    switch (script.type) {
      case 'follow-up':
        scriptType = 'follow-up';
        break;
      case 'practice':
        scriptType = 'practice';
        break;
      case 'issue':
      default:
        scriptType = 'detected issue';
    }
    let title = `[${scriptType}] ${script.name} - ${script.strategies}`;
    let titleIndex = soapNoteInfo.objective.findIndex(
      (line) => line.value === title
    );

    if (titleIndex === -1) {
      soapNoteInfo.objective.push({
        id: new mongoose.Types.ObjectId().toString(),
        isChecked: false,
        isInIssue: false,
        type: 'script',
        context: [],
        value: title
      });
    }
  }

  // sort objective notes by [detected issues] first
  soapNoteInfo.objective.sort((a, b) => {
    if (a.type === 'script' && b.type !== 'script') {
      return -1;
    } else {
      return 1;
    }
  });

  // setup the page with the data from the database
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
    issues: soapNoteInfo.issues,
    subjective: soapNoteInfo.subjective,
    objective: soapNoteInfo.objective,
    assessment: soapNoteInfo.assessment,
    plan: soapNoteInfo.plan
  };

  // setup triggers and options for each section's text boxes
  // TODO: have controllers that abstract this
  const autocompleteTriggersOptions = {
    summary: {},
    context: {},
    subjective: {},
    objective: {},
    assessment: {},
    plan: {
      // TODO: 03-03-24 -- add a "next SIG" venue
      '[practice]': [
        ' morning of office hours: ',
        ' at office hours: ',
        ' after SIG: ',
        ' day after SIG: ',
        ' morning of next SIG: ',
        ' at next SIG: ', // TODO: 03-03-24 -- add a "next SIG" venue
        ' morning of studio: ',
        ' at studio: ',
        ' after studio: '
      ],
      '[follow-up]': [' follow-up template at next SIG meeting']
    }
  };

  // TODO: 03-03-24 -- data might be redundant with the soapNoteInfo
  return {
    props: { soapNoteInfo, data, autocompleteTriggersOptions }
  };
};
