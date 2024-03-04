import type { GetServerSideProps, NextPage } from 'next';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import mongoose, { set } from 'mongoose';
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

  // hold a state for showing resolved issues
  const [showResolvedIssues, setShowResolvedIssues] = useState(false);

  // let user know that we are saving
  const [isSaving, setIsSaving] = useState(false);

  // hold a ref that checks if first load
  const firstLoad = useRef(true);

  // sections of the soap notes
  const notetakingSections = [
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
    }
    // {
    //   name: 'plan',
    //   title: 'Plan for practices and check-ins'
    // }
  ];

  const issueSections = [
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
      <div className="container mx-auto grid grid-cols-3 gap-x-5 gap-y-5 auto-rows-auto w-3/4 mt-3">
        {/* Back button */}
        <div className="col-span-3">
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

        {/* Issue Cards and SOAP Notes */}
        <div className="col-span-2">
          {/* Issue Cards */}
          <div className="mb-5">
            <h1 className="font-bold text-2xl border-b border-black mb-3">
              Tracked Issues
            </h1>
            <p className="italic mb-2">
              Click on an issue to view its details and write follow-up
              practices. Click the checkmark to resolve an issue, which means
              the issue is not of current focus but can still be added to from
              notes if needed. Click the archive icon to remove the issue from
              the list.
            </p>

            {/* Active, non-archived issues */}
            <div className="grid grid-cols-4 gap-4 grid-flow-row row-auto">
              {soapData.issues
                .filter((issue) => !issue.issueInactive && !issue.issueArchived)
                .map((issue) => (
                  <IssueCard
                    key={`issue-card-${issue.id}`}
                    issueId={issue.id}
                    title={issue.title}
                    description={issue.description}
                    lastUpdated={issue.lastUpdated}
                    selectedIssue={selectedIssue}
                    setSelectedIssue={setSelectedIssue}
                    issueIsResolved={issue.issueInactive}
                    onResolved={(e) => {
                      // confirm if the user wants to resolve the issue
                      if (
                        !confirm(
                          `Are you sure you want mark, "${issue.title}", as resolved?`
                        )
                      ) {
                        return;
                      }

                      // resolve the issue
                      let updatedIssues = soapData.issues;
                      let issueIndex = updatedIssues.findIndex(
                        (i) => i.id === issue.id
                      );
                      updatedIssues[issueIndex].issueInactive = true;
                      updatedIssues[issueIndex].lastUpdated = longDate(
                        new Date()
                      );
                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }}
                    onArchive={(e) => {
                      // confirm if the user wants to archive the issue
                      if (
                        !confirm(
                          `Are you sure you want to archive, "${issue.title}"? This cannot be undone.`
                        )
                      ) {
                        return;
                      }

                      // archive the issue
                      let updatedIssues = soapData.issues;
                      let issueIndex = updatedIssues.findIndex(
                        (i) => i.id === issue.id
                      );
                      updatedIssues[issueIndex].issueArchived = true;
                      updatedIssues[issueIndex].lastUpdated = longDate(
                        new Date()
                      );
                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }}
                  />
                ))}
            </div>

            {/* Inactive issues */}
            <div className="grid grid-cols-4 gap-4 grid-flow-row row-auto">
              <h2 className="col-span-4 text-lg font-bold mt-3">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold px-4 h-8 rounded-full"
                  onClick={(e) => {
                    setShowResolvedIssues(!showResolvedIssues);
                  }}
                >
                  {showResolvedIssues
                    ? 'Hide  currently resolved issues'
                    : 'Show currently resolved issues'}
                </button>
              </h2>
              {showResolvedIssues &&
                soapData.issues
                  .filter((issue) => issue.issueInactive)
                  .map((issue) => (
                    <IssueCard
                      key={`issue-card-${issue.id}`}
                      issueId={issue.id}
                      title={issue.title}
                      description={issue.description}
                      lastUpdated={issue.lastUpdated}
                      selectedIssue={selectedIssue}
                      setSelectedIssue={setSelectedIssue}
                      issueIsResolved={issue.issueInactive}
                      onResolved={() => {
                        // re-open the issue
                        let updatedIssues = soapData.issues;
                        let issueIndex = updatedIssues.findIndex(
                          (i) => i.id === issue.id
                        );
                        updatedIssues[issueIndex].issueInactive = false;
                        updatedIssues[issueIndex].issueArchived = false;
                        updatedIssues[issueIndex].lastUpdated = longDate(
                          new Date()
                        );
                        setSoapData((prevData) => ({
                          ...prevData,
                          issues: updatedIssues
                        }));
                      }}
                      onArchive={(e) => {
                        return;
                      }}
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
              Write notes during SIG meeting below. To attach notes to existing
              issues or create new ones, use the checkboxes to select relevant
              notes, and select the issue using the dropdown. Notes added to
              issues will have a green box to their left; notes can be added to
              multiple issues.
            </p>

            <div className="my-2">
              {/* TODO: replace this with buttons for selected lines */}
              <IssueFromHighlight
                selectOptions={soapData.issues.map((issue) => {
                  return { label: issue.title, value: issue.id };
                })}
                onClick={(event, selectedOption) => {
                  // get all lines of SOAP that were selected
                  let selectedItems = {
                    subjective: [],
                    objective: [],
                    assessment: []
                  };
                  for (let section of Object.keys(selectedItems)) {
                    selectedItems[section] = soapData[section].filter(
                      (line) => line.isChecked
                    );
                  }

                  // create the context and summary additions from the selected item
                  let contextAddition = selectedItems.subjective
                    .map((line) => line.value)
                    .concat(selectedItems.objective.map((line) => line.value))
                    .join('\n');

                  let summaryAddition = selectedItems.assessment
                    .map((line) => line.value)
                    .join('\n');

                  // get the selected option and either create a new issue or add to the existing issue
                  if (selectedOption.hasOwnProperty('__isNew__')) {
                    // create a new issue
                    let newIssue = {
                      id: new mongoose.Types.ObjectId().toString(),
                      title: selectedOption.label,
                      description: '',
                      currentInstance: {
                        id: new mongoose.Types.ObjectId().toString(),
                        date: longDate(new Date()),
                        context: contextAddition,
                        summary: summaryAddition,
                        plan: '',
                        practices: []
                      },
                      priorInstances: [],
                      lastUpdated: longDate(new Date()),
                      issueInactive: false,
                      issueArchived: false
                    };
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData.issues.push(newIssue);
                      return newSoapData;
                    });
                  } else {
                    // get the objectid for the selected issue
                    let selectedIssue = selectedOption.value;

                    // find the issue
                    let issueIndex = soapData.issues.findIndex(
                      (issue) => issue.id === selectedIssue
                    );
                    let issueInstance =
                      soapData.issues[issueIndex].currentInstance;
                    if (issueInstance === null) {
                      issueInstance = {
                        id: new mongoose.Types.ObjectId().toString(),
                        date: longDate(new Date()),
                        context: contextAddition,
                        summary: summaryAddition,
                        plan: '',
                        practices: []
                      };
                    } else {
                      issueInstance.context =
                        issueInstance.context.trim() === ''
                          ? contextAddition
                          : issueInstance.context.trim() +
                            '\n' +
                            contextAddition;
                      issueInstance.summary =
                        issueInstance.summary.trim() === ''
                          ? summaryAddition
                          : issueInstance.summary.trim() +
                            +'\n' +
                            summaryAddition;
                      issueInstance.date = longDate(new Date());
                    }

                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData.issues[issueIndex].currentInstance =
                        issueInstance;
                      newSoapData.issues[issueIndex].lastUpdated = longDate(
                        new Date()
                      );

                      // re-open the issue if new notes are added
                      newSoapData.issues[issueIndex].issueInactive = false;
                      newSoapData.issues[issueIndex].issueArchived = false;
                      return newSoapData;
                    });
                  }

                  // clear all the selected items in the SOAP note and mark lines that have been added to issues
                  let selectedItemsSets = {};
                  for (let section of Object.keys(selectedItems)) {
                    selectedItemsSets[section] = new Set(
                      selectedItems[section].map((line) => line.id)
                    );
                  }
                  setSoapData((prevSoapData) => {
                    let newSoapData = { ...prevSoapData };
                    for (let section of Object.keys(selectedItemsSets)) {
                      newSoapData[section] = newSoapData[section].map(
                        (line) => {
                          if (selectedItemsSets[section].has(line.id)) {
                            return {
                              ...line,
                              isInIssue: true,
                              isChecked: false
                            };
                          } else {
                            return line;
                          }
                        }
                      );
                    }
                    return newSoapData;
                  });
                }}
              />
            </div>

            {/* Create a text box for each section of the SOAP note */}
            {notetakingSections.map((section) => (
              <div className={`w-full`} key={section.name}>
                <h1 className="font-bold text-xl">{section.title}</h1>
                {section.name === 'plan' && (
                  <h2 className="text-sm color-grey">
                    Add practices for Orchestration Engine to follow-up on by
                    typing, &quot;[practice]&quot;. These will be sent to the
                    students&apos; project channel.
                  </h2>
                )}

                <div className="flex">
                  {/* Add check-boxes so that notes can be added to issues */}
                  <div className="flex-initial w-5">
                    {soapData[section.name].map((line) => (
                      <div
                        key={line.id}
                        className={`px-0.5 p-0.4 border border-white ${line.isInIssue ? 'bg-lime-400' : ''}`}
                      >
                        <input
                          checked={line.isChecked}
                          type="checkbox"
                          onChange={(e) => {
                            setSoapData((prevSoapData) => {
                              let newSoapData = { ...prevSoapData };
                              let lineIndex = newSoapData[
                                section.name
                              ].findIndex((l) => l.id === line.id);
                              newSoapData[section.name][lineIndex].isChecked =
                                e.target.checked;
                              return newSoapData;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Notetaking area */}
                  <div className="flex-auto">
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

                        // TODO: get whole line deleting working
                        // check if backspace key
                        if (e.key === 'Backspace') {
                          let lines = e.target.value.split('\n');
                          if (lines[lines.length - 1].trim() === '-') {
                            setSoapData((prevSoapData) => {
                              let newSoapData = { ...prevSoapData };
                              newSoapData[section.name] = [
                                ...newSoapData[section.name].slice(0, -1)
                              ];
                              return newSoapData;
                            });
                          }
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
                            type: line.includes('[practice]')
                              ? 'script'
                              : 'note',
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
                      onMouseUp={(e) => {
                        return;
                      }}
                      className="h-40 px-1"
                    />
                  </div>
                </div>
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
                  issueId={selectedIssue}
                  soapData={soapData}
                  setSoapData={setSoapData} // TODO: this needs to be per issue
                  summarySections={issueSections}
                  autocompleteTriggersOptions={autocompleteTriggersOptions}
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
