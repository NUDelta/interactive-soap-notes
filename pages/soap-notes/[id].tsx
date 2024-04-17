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

import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon';
import ExclamationCircleIcon from '@heroicons/react/24/outline/ExclamationCircleIcon';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

import { Checkbox, Tooltip } from 'flowbite-react';
import NoteBlock from '../../components/NoteBlock';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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
  const [selectedIssue, setSelectedIssue] = useState('this-weeks-notes');

  // hold a state for showing resolved issues
  const [showResolvedIssues, setShowResolvedIssues] = useState(false);

  // let user know that we are saving and if there were any errors
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // hold a ref that checks if first load
  const firstLoad = useRef(true);

  // sections of the soap notes
  const notetakingSections = [
    // {
    //   name: 'subjective',
    //   title: 'Subjective information from student(s)'
    // },
    {
      name: 'objective',
      title: 'Context (e.g., signals from OS; observations during SIG)'
    },
    {
      name: 'assessment',
      title:
        'Assessment of practice obstacles (e.g., cognitive, metacognitive, emotional, behavorial, and / or strategic blockers)'
    },
    {
      name: 'plan',
      title: 'Practice plan to address practice obstacles'
    }
  ];

  const issueSections = [
    {
      name: 'context',
      title: 'Context (e.g., signals from OS; observations during SIG)'
    },
    {
      name: 'summary',
      title:
        'Assessment of practice obstacles (e.g., cognitive, metacognitive, emotional, behavorial, and / or strategic blockers)'
    },
    {
      name: 'plan',
      title: 'Practice plan to address practice obstacles'
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

      let dataToSave = structuredClone({
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
      });

      // parse the date for issues before sending it back to the server
      dataToSave.issues.forEach((issue) => {
        // replace issue last updated with a date object
        issue.lastUpdated = new Date(issue.lastUpdated);

        // if currentInstance is not null, then replace it's date with a date object
        if (issue.currentInstance !== null) {
          issue.currentInstance.date = new Date(issue.currentInstance.date);
        }

        // replace all prior instances' dates with date objects
        issue.priorInstances.forEach((instance) => {
          instance.date = new Date(instance.date);
        });
      });

      // make request to save the data to the database
      try {
        const res = await fetch(`/api/soap/${soapNoteInfo.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const output = await res.json();

        // if there's an error, throw an exception
        if (!res.ok) {
          throw new Error(`Error from server: ${output.error}`);
        }

        // otherwise, update the local data without a revalidation
        if (output.data !== null) {
          mutate(`/api/soap/${soapNoteInfo.id}`, output.data, false);
        }

        // update the last updated timestamp for the note
        setNoteInfo((prevNoteInfo) => ({
          ...prevNoteInfo,
          lastUpdated: longDate(lastUpdated, true)
        }));

        // if there's no error, clear the error state
        setSaveError(null);
      } catch (err) {
        // if there's an error, set the error state
        console.error('Error in saving SOAP note: ', err);
        setSaveError(err.message);
      }

      // saving is completed
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
      <div className="container mx-auto grid grid-cols-3 gap-x-5 gap-y-5 auto-rows-auto w-full mt-3">
        {/* Back button */}
        <div className="col-span-3">
          <Link href="/">
            <h3 className="text-md text-blue-600 hover:text-blue-800 visited:text-purple-600">
              &#8592; Back
            </h3>
          </Link>
        </div>

        {/* Title and last updated */}
        <div className="flex flex-col col-span-3">
          <h1 className="font-bold text-3xl">
            {noteInfo.project} | {noteInfo.sigDate}
          </h1>

          {/* Save status */}
          {/* Three states of saved: (1) saved without error; (2) saving; (3) save attemped but error */}
          <div className="flex flex-row items-center">
            {/* Saved successfully */}
            {!isSaving && saveError === null ? (
              <>
                <CheckCircleIcon className="w-6 h-6 mr-0.5 text-green-600" />
                <h2 className="font-bold text-base text-green-600">
                  Notes last saved on {noteInfo.lastUpdated}
                </h2>
              </>
            ) : (
              <></>
            )}

            {/* Saving */}
            {isSaving ? (
              <>
                <ArrowPathIcon className="animate-spin w-6 h-6 mr-0.5 text-blue-600" />
                <h2 className="font-bold text-base text-blue-600">Saving...</h2>
              </>
            ) : (
              <></>
            )}

            {/* Save attempted but error */}
            {!isSaving && saveError !== null ? (
              <>
                <Tooltip content={saveError} placement="bottom">
                  <ExclamationCircleIcon className="w-6 h-6 mr-0.5 text-red-600" />
                </Tooltip>
                <h2 className="font-bold text-base text-red-600">
                  Error in saving notes (Last saved: {noteInfo.lastUpdated})
                </h2>
              </>
            ) : (
              <></>
            )}
          </div>
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
        <DndProvider backend={HTML5Backend}>
          <div className="col-span-3">
            {/* Issue Cards */}
            <div className="mb-5">
              <h1 className="font-bold text-2xl border-b border-black mb-3">
                Tracked Practices
              </h1>
              <p className="italic mb-2">
                Click on an practice to view its details, and current issue for
                the practice. Click the checkmark to resolve a practice, which
                means the practice is not of current focus but can still be
                added to from notes if needed. Click the archive icon to remove
                the practice, meaning it is no longer relevant for the project
                or student.
              </p>

              {/* Show issue cards for active, non-archived issues */}
              <div className="grid grid-cols-6 gap-4 grid-flow-row row-auto">
                {/* issue card for this week's notes */}
                <IssueCard
                  key="issue-card-this-week"
                  issueId="this-weeks-notes"
                  title="This week's notes"
                  description="Notes from SIG"
                  lastUpdated={noteInfo.lastUpdated}
                  selectedIssue={selectedIssue}
                  setSelectedIssue={setSelectedIssue}
                  currInstance={null}
                  issueIsResolved={false}
                  onResolved={() => {
                    return;
                  }}
                  onArchive={() => {
                    return;
                  }}
                />

                {/* tracked issue cards */}
                {soapData.issues
                  .filter(
                    (issue) => !issue.issueInactive && !issue.issueArchived
                  )
                  .map((issue) => (
                    <IssueCard
                      key={`issue-card-${issue.id}`}
                      issueId={issue.id}
                      title={issue.title}
                      description={issue.description}
                      lastUpdated={issue.lastUpdated}
                      selectedIssue={selectedIssue}
                      setSelectedIssue={setSelectedIssue}
                      currInstance={issue.currentInstance}
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

                {/* issue card to add new issue */}
                <IssueCard
                  key="issue-card-add-issue"
                  issueId="add-issue"
                  title="Add issue"
                  description="Notes from SIG"
                  lastUpdated={noteInfo.lastUpdated}
                  selectedIssue={selectedIssue}
                  setSelectedIssue={setSelectedIssue}
                  currInstance={null}
                  issueIsResolved={false}
                  onResolved={() => {
                    return;
                  }}
                  onArchive={() => {
                    return;
                  }}
                />
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
                        currInstance={issue.currentInstance}
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
            {/* show either the regular note section or the note pane */}
            <div>
              {selectedIssue !== null &&
              selectedIssue !== 'this-weeks-notes' ? (
                <>
                  {/* TODO: title should change based on what practice is selected */}
                  {/* TODO: for issues, allow the title to be edited */}
                  {/* TODO: once this uses the same schema as the regular notes, then the code can be compressed */}
                  <h1 className="font-bold text-2xl border-b border-black mb-3">
                    Selected Practice
                  </h1>
                  <IssuePane
                    issueId={selectedIssue}
                    soapData={soapData}
                    setSoapData={setSoapData} // TODO: this needs to be per issue
                    summarySections={issueSections}
                    autocompleteTriggersOptions={autocompleteTriggersOptions}
                  />
                </>
              ) : (
                <div>
                  <h1 className="font-bold text-2xl border-b border-black mb-3">
                    This week&apos;s notes
                  </h1>

                  {/* TODO: show only for the default note; for issues, replace with an editable description */}
                  <p className="italic">
                    Write notes from SIG below. Attach notes to existing
                    practices or create a new tracked practice by dragging the
                    note onto the Tracked Practices above.
                  </p>

                  {/* Create section for each part of the CAP notes */}
                  {notetakingSections.map((section) => (
                    <div className="w-full mb-4" key={section.name}>
                      <h1 className="font-bold text-xl">{section.title}</h1>
                      {section.name === 'plan' && (
                        <h2 className="text-sm color-grey">
                          Add practices for CAP notes to follow-up on by typing,
                          &quot;[&quot; and selecting from the autocomplete
                          options. These will be sent to the students&apos;
                          project channel before the next practice opportunity,
                          or after SIG for self-practice.
                        </h2>
                      )}

                      <div className="flex">
                        {/* Notetaking area */}
                        <div className="flex-auto">
                          {/* each section's lines of notes in it's own chunk*/}
                          {/* TODO: turn this into a component so draggable can be used */}
                          {/* TODO: think about how to add an empty block if there's no notes yet */}
                          {/* One way is to have a placeholder block so the same code can be used; if the last block is deleted, then automatically add another with a placeholder text */}
                          {soapData[section.name].map((line) => (
                            <NoteBlock
                              key={line.id}
                              noteSection={section.name}
                              noteId={line.id}
                              noteContent={line}
                              onKeyDown={(e) => {
                                // stop default behavior of enter key if both enter and shift are pressed
                                if (e.key === 'Enter' && e.shiftKey) {
                                  e.preventDefault();
                                }
                              }}
                              onKeyUp={(e) => {
                                // check for shift-enter to add a new line
                                if (e.key === 'Enter' && e.shiftKey) {
                                  // add new line underneath the current line
                                  setSoapData((prevSoapData) => {
                                    let newSoapData = { ...prevSoapData };
                                    let lineIndex = newSoapData[
                                      section.name
                                    ].findIndex((l) => l.id === line.id);

                                    // if new line to add is at the end of the list, only add if there's not already an empty line
                                    // if (
                                    //   lineIndex ===
                                    //   newSoapData[section.name].length - 1
                                    // ) {
                                    //   if (
                                    //     newSoapData[section.name][
                                    //       lineIndex
                                    //     ].value.trim() === ''
                                    //   ) {
                                    //     return newSoapData;
                                    //   }
                                    // }

                                    // otherwise, add to the list
                                    newSoapData[section.name].splice(
                                      lineIndex + 1,
                                      0,
                                      {
                                        id: new mongoose.Types.ObjectId().toString(),
                                        isChecked: false,
                                        isInIssue: false,
                                        type: 'note',
                                        context: [],
                                        value: ''
                                      }
                                    );

                                    return newSoapData;
                                  });
                                }
                              }}
                              // TODO: this only handles when user unfocues on the line, not when the line is actively being edited
                              onChange={(e) => {
                                // before attempting a save, check if the line is identical to the previous line (both trimmed)
                                let edits = e.currentTarget.textContent.trim();
                                if (edits === line.value.trim()) {
                                  return;
                                }

                                // save edits to the correct line
                                setSoapData((prevSoapData) => {
                                  // get the current data and correct line that was changed
                                  let newSoapData = { ...prevSoapData };
                                  let lineIndex = newSoapData[
                                    section.name
                                  ].findIndex((l) => l.id === line.id);

                                  newSoapData[section.name][lineIndex].value =
                                    edits;
                                  return newSoapData;
                                });
                              }}
                              onDragToIssue={(
                                issueId,
                                noteSection,
                                noteBlock
                              ) => {
                                // map note content into the correct section
                                // TODO: make the names consistent
                                // TODO: make the schema consistent and just move around note blocks
                                let editsToIssue = {
                                  context:
                                    noteSection === 'objective'
                                      ? noteBlock.value
                                      : '',
                                  summary:
                                    noteSection === 'assessment'
                                      ? noteBlock.value
                                      : '',
                                  plan:
                                    noteSection === 'plan'
                                      ? noteBlock.value
                                      : ''
                                };

                                // get the issue to add the edits to
                                if (
                                  issueId === 'add-issue' ||
                                  issueId === 'this-weeks-notes'
                                ) {
                                  // create a new issue
                                  let newIssue = {
                                    id: new mongoose.Types.ObjectId().toString(),
                                    title: 'unnamed issue',
                                    description: '',
                                    currentInstance: {
                                      id: new mongoose.Types.ObjectId().toString(),
                                      date: longDate(new Date()),
                                      context: editsToIssue['context'],
                                      summary: editsToIssue['summary'],
                                      plan: editsToIssue['plan'],
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

                                  issueId = newIssue.id;
                                } else {
                                  // find the issue
                                  let issueIndex = soapData.issues.findIndex(
                                    (issue) => issue.id === issueId
                                  );
                                  let issueInstance =
                                    soapData.issues[issueIndex].currentInstance;

                                  if (issueInstance === null) {
                                    // if the current instance doesn't exist, intialize it with the additions from the notetaking space
                                    issueInstance = {
                                      id: new mongoose.Types.ObjectId().toString(),
                                      date: longDate(new Date()),
                                      context: editsToIssue['context'],
                                      summary: editsToIssue['summary'],
                                      plan: editsToIssue['plan'],
                                      practices: []
                                    };
                                  } else {
                                    // TODO: issue instance doesn't use the same schema as SOAP notes
                                    // otherwise, add the additions to the current instance
                                    issueInstance.context =
                                      issueInstance.context.trim() === ''
                                        ? editsToIssue['context']
                                        : issueInstance.context.trim() +
                                          '\n' +
                                          editsToIssue['context'];

                                    issueInstance.summary =
                                      issueInstance.summary.trim() === ''
                                        ? editsToIssue['summary']
                                        : issueInstance.summary.trim() +
                                          +'\n' +
                                          editsToIssue['summary'];

                                    issueInstance.plan =
                                      issueInstance.plan.trim() === ''
                                        ? editsToIssue['plan']
                                        : issueInstance.plan.trim() +
                                          +'\n' +
                                          editsToIssue['plan'];

                                    issueInstance.date = longDate(new Date());
                                  }

                                  setSoapData((prevSoapData) => {
                                    let newSoapData = { ...prevSoapData };
                                    newSoapData.issues[
                                      issueIndex
                                    ].currentInstance = issueInstance;
                                    newSoapData.issues[issueIndex].lastUpdated =
                                      longDate(new Date());

                                    // re-open the issue if new notes are added
                                    newSoapData.issues[
                                      issueIndex
                                    ].issueInactive = false;
                                    newSoapData.issues[
                                      issueIndex
                                    ].issueArchived = false;
                                    return newSoapData;
                                  });

                                  issueId = soapData.issues[issueIndex].id;
                                }

                                // TODO: remove note block that was dragged into the issue
                                setSoapData((prevSoapData) => {
                                  let newSoapData = { ...prevSoapData };

                                  // remove the note block from the edited section
                                  newSoapData[noteSection] = newSoapData[
                                    noteSection
                                  ].filter((line) => line.id !== noteBlock.id);
                                  return newSoapData;
                                });

                                // highlight the issue that was just edited or created
                                setSelectedIssue(issueId);
                              }}
                            />
                          ))}
                          <div className="italic text-slate-400">
                            Press Shift-Enter to add a new text block
                          </div>

                          {/* Add helper text on how to use the plan section */}
                          {/* TODO: probably good have quick adds for these */}
                          {section.name === 'plan' && (
                            <div className="text-xs text-gray-700 italic">
                              <p>
                                [plan]: stories, deliverables, or tasks to add
                                to the student&apos;s sprint
                              </p>
                              <p>
                                [help]: work with your SIG head in office hours
                                or mysore
                              </p>
                              <p>
                                [help]: get help from a peer during Pair
                                Research
                              </p>
                              <p>
                                [reflect]: reflect on a situation if it comes up
                              </p>
                              <p>
                                [self-work]: work activity for student to do on
                                their own
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DndProvider>
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

  // if any section has no data, add a placeholder line
  const addPlaceholderLine = (section) => {
    if (soapNoteInfo[section].length === 0) {
      soapNoteInfo[section].push({
        id: new mongoose.Types.ObjectId().toString(),
        isChecked: false,
        isInIssue: false,
        type: 'note',
        context: [],
        value: ''
      });
    }
  };
  addPlaceholderLine('subjective');
  addPlaceholderLine('objective');
  addPlaceholderLine('assessment');
  addPlaceholderLine('plan');

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
    let title =
      scriptType == 'follow-up'
        ? `[${scriptType}] ${script.strategies}`
        : `[${scriptType}] ${script.name} - ${script.strategies}`;
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
      // '[practice]': [
      //   ' morning of office hours: ',
      //   ' at office hours: ',
      //   ' after SIG: ',
      //   ' day after SIG: ',
      //   ' morning of next SIG: ',
      //   ' at next SIG: ',
      //   ' morning of studio: ',
      //   ' at studio: ',
      //   ' after studio: '
      // ],
      // '[follow-up]': [' follow-up template at next SIG meeting']
      '[': [
        'plan]: ',
        'mentor help]: ',
        'student help]: ',
        'reflect]: ',
        'self-work]: '
      ]
    }
  };

  // TODO: 03-03-24 -- data might be redundant with the soapNoteInfo
  return {
    props: { soapNoteInfo, data, autocompleteTriggersOptions }
  };
};
