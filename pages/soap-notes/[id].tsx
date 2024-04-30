import type { GetServerSideProps } from 'next';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import mongoose from 'mongoose';
import { mutate } from 'swr';

import { fetchCAPNote } from '../../controllers/capNotes/fetchCAPNotes';
import PracticeCard from '../../components/PracticeCard';
import PracticePane from '../../components/PracticePane';
import { longDate, shortDate } from '../../lib/helperFns';

import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon';
import ExclamationCircleIcon from '@heroicons/react/24/outline/ExclamationCircleIcon';

import { Tooltip } from 'flowbite-react';
import NoteBlock from '../../components/NoteBlock';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default function SOAPNote({
  capNoteInfo,
  data,
  autocompleteTriggersOptions
}): JSX.Element {
  // have state for soap note data
  const [noteInfo, setNoteInfo] = useState(capNoteInfo);

  // hold data from the current soap notes
  const [capData, setCAPData] = useState(data);

  // hold a state for which issue is selected
  const [selectedIssue, setSelectedIssue] = useState('this-weeks-notes');

  // hold a state for showing resolved issues
  const [showResolvedIssues, setShowResolvedIssues] = useState(false);

  // let user know that we are saving and if there were any errors
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // hold a ref that checks if first load
  const firstLoad = useRef(true);

  // sections of the CAP notes
  const notetakingSections = [
    {
      name: 'context',
      title: 'Context: what are you hearing or seeing that’s bothering you? '
    },
    {
      name: 'assessment',
      title: 'Assessment: what is happening?'
    },
    {
      name: 'plan',
      title: 'Plan: what do we do about it?'
    }
  ];

  const issueSections = [
    {
      name: 'context',
      title: 'Context: what are you hearing or seeing that’s bothering you? '
    },
    {
      name: 'assessment',
      title: 'Assessment: what is happening?'
    },
    {
      name: 'plan',
      title: 'Plan: what do we do about it?'
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

      // TODO: needs to be fixed for the new practice agents
      // check if any lines have a [practice] tag
      // for (let practice of capData.practices) {
      //   // check if current instance is not null
      //   if (practice.currentInstance === null) {
      //     continue;
      //   }

      //   // parse follow-ups plans for each current issue instance
      //   let lines = practice.currentInstance.plan;
      //   let scripts = lines.filter((line) => line.value.includes('[practice]'));

      //   // create objects for each script
      //   let output = [];
      //   for (let script of scripts) {
      //     // check if the script is fully written before adding it to output
      //     let splitFollowUp = script.split('[practice]')[1].split(':');
      //     if (
      //       splitFollowUp.length < 2 ||
      //       splitFollowUp[1].trim() === '[follow-up to send]' ||
      //       splitFollowUp[1].trim() === ''
      //     ) {
      //       continue;
      //     } else {
      //       let [venue, strategy] = splitFollowUp;
      //       output.push({
      //         practice: strategy.trim(),
      //         opportunity: venue.trim(),
      //         person: 'students',
      //         activeIssueId: ''
      //       });
      //     }
      //   }

      //   practice.currentInstance.practices = output;
      // }

      let dataToSave = structuredClone({
        project: capNoteInfo.project,
        date: capNoteInfo.sigDate,
        lastUpdated: lastUpdated,
        sigName: capNoteInfo.sigName,
        sigAbbreviation: capNoteInfo.sigAbbreviation,
        context: capData.context ?? [],
        assessment: capData.assessment ?? [],
        plan: capData.plan ?? [],
        trackedPractices: capData.practices ?? [],
        currIssueInstances: capData.issues ?? []
      });

      // parse the date for trackedPractices before sending it back to the server
      dataToSave.trackedPractices.forEach((practice) => {
        // replace issue last updated with a date object
        practice.lastUpdated = new Date(practice.lastUpdated);

        // if currentInstance is not null, then replace it's date with a date object
        if (practice.currentInstance !== null) {
          practice.currentInstance.date = new Date(
            practice.currentInstance.date
          );
        }

        // replace all prior instances' dates with date objects
        practice.priorInstances.forEach((instance) => {
          instance.date = new Date(instance.date);
        });
      });

      // make request to save the data to the database
      try {
        const res = await fetch(`/api/soap/${capNoteInfo.id}`, {
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
          mutate(`/api/soap/${capNoteInfo.id}`, output.data, false);
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
    }, 1000); // TODO: lowering for now to handle div issue, but should be 5000

    return () => clearTimeout(timeOutId);
  }, [capData, capNoteInfo]);

  // return the page
  return (
    <>
      {/* Set title of the page to be project name */}
      <Head>
        <title>{noteInfo.project}</title>
      </Head>

      {/* Header info for SOAP note */}
      <div className="w-11/12 mx-auto grid grid-cols-3 gap-x-5 gap-y-5 auto-rows-auto  mt-3">
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

        {/* TODO: 04-30-24 setup the page as 2 half pages, with a 2 flex rows */}
        <DndProvider backend={HTML5Backend}>
          {/* Past issues and tracked practices */}
          <div className="w-1/2">
            <div className="flex flex-row">
              <div>Current issues</div>
              <div>Note space</div>
            </div>
          </div>

          {/* Current issues and note space */}
          <div className="w-1/2">
            <div className="flex flex-row">
              <div>Current issues</div>
              <div>Note space</div>
            </div>
          </div>
        </DndProvider>

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
                the practice; clicking it again will switch you back to This
                Week&apos;s Notes. New practices can be created using the last
                cell.
              </p>

              {/* Active Practices */}
              <div className="grid grid-cols-4 gap-1 grid-flow-row row-auto">
                {/* issue card for this week's notes */}
                {/* <PracticeCard
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
                /> */}

                {/* tracked practices */}
                {/* TODO: 04-30-24 -- practice cards should only show the practice. as used here, these should be issue cards */}
                {capData.practices
                  .filter(
                    (practice) =>
                      !practice.practiceInactive && !practice.practiceArchived
                  )
                  .map((practice) => (
                    <PracticeCard
                      key={`issue-card-${practice.id}`}
                      issueId={practice.id}
                      title={practice.title}
                      description={practice.description}
                      lastUpdated={practice.lastUpdated}
                      selectedIssue={selectedIssue}
                      setSelectedIssue={setSelectedIssue}
                      currInstance={practice.currentInstance}
                      priorInstances={practice.priorInstances}
                      issueIsResolved={practice.practiceInactive}
                      noteDate={noteInfo.sigDate}
                      onResolved={(e) => {
                        // confirm if the user wants to resolve the issue
                        if (
                          !confirm(
                            `Are you sure you want mark, "${practice.title}", as resolved?`
                          )
                        ) {
                          return;
                        }

                        // resolve the issue
                        let updatedPractices = capData.practices;
                        let practiceIndex = updatedPractices.findIndex(
                          (i) => i.id === practice.id
                        );
                        updatedPractices[practiceIndex].practiceInactive = true;
                        updatedPractices[practiceIndex].lastUpdated = longDate(
                          new Date()
                        );
                        setCAPData((prevData) => ({
                          ...prevData,
                          trackedPractices: updatedPractices
                        }));
                      }}
                      onArchive={(e) => {
                        // confirm if the user wants to archive the issue
                        if (
                          !confirm(
                            `Are you sure you want to archive, "${practice.title}"? This cannot be undone.`
                          )
                        ) {
                          return;
                        }

                        // archive the issue
                        let updatedPractices = capData.practices;
                        let practiceIndex = updatedPractices.findIndex(
                          (i) => i.id === practice.id
                        );
                        updatedPractices[practiceIndex].practiceArchived = true;
                        updatedPractices[practiceIndex].lastUpdated = longDate(
                          new Date()
                        );
                        setCAPData((prevData) => ({
                          ...prevData,
                          practices: updatedPractices
                        }));
                      }}
                    />
                  ))}

                {/* practice card for new issues */}
                <PracticeCard
                  key="issue-card-add-practice"
                  issueId="add-practice"
                  title="Add issue"
                  description="Notes from SIG"
                  lastUpdated={noteInfo.lastUpdated}
                  selectedIssue={selectedIssue}
                  setSelectedIssue={setSelectedIssue}
                  currInstance={null}
                  issueIsResolved={false}
                  noteDate={noteInfo.sigDate}
                  onResolved={() => {
                    return;
                  }}
                  onArchive={() => {
                    return;
                  }}
                  onAddPractice={(practiceTitle) => {
                    // create a new practice
                    let newPractice = {
                      id: new mongoose.Types.ObjectId().toString(),
                      title: practiceTitle,
                      description: '',
                      lastUpdated: longDate(new Date()),
                      practiceInactive: false,
                      practiceArchived: false,
                      currentInstance: {
                        id: new mongoose.Types.ObjectId().toString(),
                        date: longDate(new Date()),
                        context: [
                          {
                            id: new mongoose.Types.ObjectId().toString(),
                            type: 'note',
                            context: [],
                            value: ''
                          }
                        ],
                        assessment: [
                          {
                            id: new mongoose.Types.ObjectId().toString(),
                            type: 'note',
                            context: [],
                            value: ''
                          }
                        ],
                        plan: [
                          {
                            id: new mongoose.Types.ObjectId().toString(),
                            type: 'note',
                            context: [],
                            value: ''
                          }
                        ],
                        followUps: []
                      },
                      priorInstances: []
                    };

                    setCAPData((prevCapData) => {
                      let newCAPData = { ...prevCapData };
                      newCAPData.practices.push(newPractice);
                      return newCAPData;
                    });
                  }}
                />
              </div>

              {/* Inactive practices */}
              {/* <div className="grid grid-cols-4 gap-4 grid-flow-row row-auto">
                <h2 className="col-span-4 text-lg font-bold mt-3">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold px-4 h-8 rounded-full"
                    onClick={(e) => {
                      setShowResolvedIssues(!showResolvedIssues);
                    }}
                  >
                    {showResolvedIssues
                      ? 'Hide currently resolved issues'
                      : 'Show currently resolved issues'}
                  </button>
                </h2>
                {showResolvedIssues &&
                  capData.practices
                    .filter((practice) => practice.practiceInactive)
                    .map((practice) => (
                      <PracticeCard
                        key={`issue-card-${practice.id}`}
                        issueId={practice.id}
                        title={practice.title}
                        description={practice.description}
                        lastUpdated={practice.lastUpdated}
                        selectedIssue={selectedIssue}
                        setSelectedIssue={setSelectedIssue}
                        currInstance={practice.currentInstance}
                        issueIsResolved={practice.practiceInactive}
                        onResolved={() => {
                          // re-open the issue
                          let updatedPractices = capData.practices;
                          let practiceIndex = updatedPractices.findIndex(
                            (i) => i.id === practice.id
                          );
                          updatedPractices[practiceIndex].issueInactive = false;
                          updatedPractices[practiceIndex].issueArchived = false;
                          updatedPractices[practiceIndex].lastUpdated =
                            longDate(new Date());
                          setCAPData((prevData) => ({
                            ...prevData,
                            issues: updatedPractices
                          }));
                        }}
                        onArchive={(e) => {
                          return;
                        }}
                      />
                    ))}
              </div> */}
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
                  <PracticePane
                    practiceId={selectedIssue}
                    capData={capData}
                    setCAPData={setCAPData} // TODO: this needs to be per issue
                    summarySections={issueSections}
                    autocompleteTriggersOptions={autocompleteTriggersOptions}
                  />
                </>
              ) : (
                <div>
                  <h1 className="font-bold text-2xl border-b border-black mb-3">
                    This Week&apos;s Notes
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
                          {capData[section.name].map((line) => (
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
                                // store id of new line so it can be focused on
                                let newLineId;

                                // check for shift-enter to add a new line
                                if (e.key === 'Enter' && e.shiftKey) {
                                  // add new line underneath the current line
                                  setCAPData((prevCAPData) => {
                                    let newCAPData = { ...prevCAPData };
                                    let lineIndex = newCAPData[
                                      section.name
                                    ].findIndex((l) => l.id === line.id);

                                    // check if the current line is empty
                                    if (
                                      lineIndex ===
                                      newCAPData[section.name].length - 1
                                    ) {
                                      // don't add a new line if the current line is empty
                                      if (
                                        newCAPData[section.name][
                                          lineIndex
                                        ].value.trim() === ''
                                      ) {
                                        newLineId =
                                          newCAPData[section.name][lineIndex]
                                            .id;
                                        return newCAPData;
                                      }
                                    }
                                    // check if the next line is empty
                                    else if (
                                      lineIndex + 1 <
                                      newCAPData[section.name].length
                                    ) {
                                      // don't add a new line if the next line is already an empty block
                                      if (
                                        newCAPData[section.name][
                                          lineIndex + 1
                                        ].value.trim() === ''
                                      ) {
                                        newLineId =
                                          newCAPData[section.name][
                                            lineIndex + 1
                                          ].id;
                                        return newCAPData;
                                      }
                                    }

                                    // otherwise, add to the list
                                    newLineId =
                                      new mongoose.Types.ObjectId().toString();
                                    newCAPData[section.name].splice(
                                      lineIndex + 1,
                                      0,
                                      {
                                        id: newLineId,
                                        type: 'note',
                                        context: [],
                                        value: ''
                                      }
                                    );
                                    return newCAPData;
                                  });

                                  // TODO: 04-23-24 this causes a race condition where the new line is not yet rendered
                                  // could be fixed with a callback: https://github.com/the-road-to-learn-react/use-state-with-callback#usage
                                  // set focus to added line if not undefined
                                  // if (newLineId !== undefined) {
                                  //   document.getElementById(newLineId).focus();
                                  // }
                                }
                              }}
                              // TODO: this only handles when user unfocues on the line, not when the line is actively being edited
                              onChange={(edits) => {
                                // before attempting a save, check if the line is identical to the previous line (both trimmed)
                                edits = edits.trim();
                                if (edits === line.value.trim()) {
                                  return;
                                }

                                // save edits to the correct line
                                setCAPData((prevCAPData) => {
                                  // get the current data and correct line that was changed
                                  let newCAPData = { ...prevCAPData };
                                  let lineIndex = newCAPData[
                                    section.name
                                  ].findIndex((l) => l.id === line.id);

                                  newCAPData[section.name][lineIndex].value =
                                    edits;

                                  return newCAPData;
                                });
                              }}
                              onDragToIssue={(
                                practiceId,
                                noteSection,
                                noteBlock
                              ) => {
                                // map note content into the correct section
                                let editsToIssue = {
                                  context:
                                    noteSection === 'context'
                                      ? [noteBlock]
                                      : [
                                          {
                                            id: new mongoose.Types.ObjectId().toString(),
                                            type: 'note',
                                            context: [],
                                            value: ''
                                          }
                                        ],
                                  assessment:
                                    noteSection === 'assessment'
                                      ? [noteBlock]
                                      : [
                                          {
                                            id: new mongoose.Types.ObjectId().toString(),
                                            type: 'note',
                                            context: [],
                                            value: ''
                                          }
                                        ],
                                  plan:
                                    noteSection === 'plan'
                                      ? [noteBlock]
                                      : [
                                          {
                                            id: new mongoose.Types.ObjectId().toString(),
                                            type: 'note',
                                            context: [],
                                            value: ''
                                          }
                                        ]
                                };

                                // create a new practice if the note is dragged into the add practice section
                                if (
                                  practiceId === 'add-practice' ||
                                  practiceId === 'this-weeks-notes'
                                ) {
                                  // create a new practice
                                  let newPractice = {
                                    id: new mongoose.Types.ObjectId().toString(),
                                    title: noteBlock.value.trim(),
                                    description: '',
                                    lastUpdated: longDate(new Date()),
                                    practiceInactive: false,
                                    practiceArchived: false,
                                    currentInstance: {
                                      id: new mongoose.Types.ObjectId().toString(),
                                      date: longDate(new Date()),
                                      context: editsToIssue['context'],
                                      assessment: editsToIssue['assessment'],
                                      plan: editsToIssue['plan'],
                                      followUps: []
                                    },
                                    priorInstances: []
                                  };

                                  setCAPData((prevCapData) => {
                                    let newCAPData = { ...prevCapData };
                                    newCAPData.practices.push(newPractice);
                                    return newCAPData;
                                  });

                                  practiceId = newPractice.id;
                                }
                                // otherwise, add data to the practice
                                else {
                                  // find the practice
                                  let practiceIndex =
                                    capData.practices.findIndex(
                                      (practice) => practice.id === practiceId
                                    );
                                  let issueInstance =
                                    capData.practices[practiceIndex]
                                      .currentInstance;

                                  // create a new issue instance for the practice if it doesn't exist
                                  if (issueInstance === null) {
                                    // if the current instance doesn't exist, intialize it with the additions from the notetaking space
                                    issueInstance = {
                                      id: new mongoose.Types.ObjectId().toString(),
                                      date: longDate(new Date()),
                                      context: editsToIssue['context'],
                                      assessment: editsToIssue['summary'],
                                      plan: editsToIssue['plan'],
                                      practices: []
                                    };
                                  } else {
                                    // if the current instance exists, check if the new additions are empty
                                    if (
                                      issueInstance['context'].length === 1 &&
                                      issueInstance['context'][0].value === ''
                                    ) {
                                      issueInstance.context =
                                        editsToIssue['context'];
                                    } else {
                                      // otherwise, add the additions to the current instance
                                      issueInstance.context =
                                        issueInstance.context.concat(
                                          editsToIssue['context']
                                        );
                                    }

                                    // repeat for assessment
                                    if (
                                      issueInstance['assessment'].length ===
                                        1 &&
                                      issueInstance['assessment'][0].value ===
                                        ''
                                    ) {
                                      issueInstance.assessment =
                                        editsToIssue['assessment'];
                                    } else {
                                      // otherwise, add the additions to the current instance
                                      issueInstance.assessment =
                                        issueInstance.assessment.concat(
                                          editsToIssue['assessment']
                                        );
                                    }

                                    // repeat for plan
                                    if (
                                      issueInstance['plan'].length === 1 &&
                                      issueInstance['plan'][0].value === ''
                                    ) {
                                      issueInstance.plan = editsToIssue['plan'];
                                    } else {
                                      // otherwise, add the additions to the current instance
                                      issueInstance.plan =
                                        issueInstance.plan.concat(
                                          editsToIssue['plan']
                                        );
                                    }

                                    // update the last updated date
                                    issueInstance.date = longDate(new Date());
                                  }

                                  setCAPData((prevCAPData) => {
                                    let newCAPData = { ...prevCAPData };
                                    newCAPData.practices[
                                      practiceIndex
                                    ].currentInstance = issueInstance;
                                    newCAPData.practices[
                                      practiceIndex
                                    ].lastUpdated = longDate(new Date());

                                    // re-open the issue if new notes are added
                                    newCAPData.practices[
                                      practiceIndex
                                    ].issueInactive = false;
                                    newCAPData.practices[
                                      practiceIndex
                                    ].issueArchived = false;
                                    return newCAPData;
                                  });

                                  practiceId =
                                    capData.practices[practiceIndex].id;
                                }

                                // remove note block that was dragged into the issue
                                setCAPData((prevCAPData) => {
                                  let newSoapData = { ...prevCAPData };

                                  // remove the note block from the edited section
                                  newSoapData[noteSection] = newSoapData[
                                    noteSection
                                  ].filter((line) => line.id !== noteBlock.id);

                                  // if the section is empty, add a new empty block
                                  if (newSoapData[noteSection].length === 0) {
                                    newSoapData[noteSection].push({
                                      id: new mongoose.Types.ObjectId().toString(),
                                      type: 'note',
                                      context: [],
                                      value: ''
                                    });
                                  }
                                  return newSoapData;
                                });
                              }}
                            />
                          ))}

                          {/* Add helper text on how to use the plan section */}
                          {section.name === 'plan' && (
                            <>
                              <div className="italic text-slate-400">
                                Press Shift-Enter to add a new text block. Press
                                Tab to move to next block, and Shift-Tab to move
                                to previous block.
                              </div>
                              <div className="text-sm text-gray-700 italic mt-2">
                                <h2 className="font-bold">
                                  Practice follow-ups
                                </h2>
                                <div className="grid grid-cols-2 gap-y-1 w-2/3">
                                  <p>
                                    [plan]: stories, deliverables, or tasks to
                                    add to the student&apos;s sprint
                                  </p>
                                  <p>
                                    [help]: work with a peer or mentor on
                                    practice
                                  </p>
                                  <p>
                                    [reflect]: reflect on a situation if it
                                    comes up
                                  </p>
                                  <p>
                                    [self-work]: work activity for student to do
                                    on their own
                                  </p>
                                </div>

                                <h2 className="font-bold mt-4">
                                  Include additional info using:
                                </h2>
                                <div className="grid grid-cols-2 gap-y-1 w-2/3">
                                  {/* what (practice), who, where / when, how */}
                                  <p>
                                    w/[person, person]: person(s) who the
                                    practice should be done with
                                  </p>
                                  <p>
                                    @[venue]: specific venue to do the practice;
                                    CAP will follow-up at the next one.
                                  </p>
                                  <p>
                                    rep/[representation]: representation to use
                                    for practice (e.g., canvas section; sketch
                                    of a journey map; reflection question(s))
                                  </p>
                                </div>
                                <br></br>
                              </div>
                            </>
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

  /** it
   *
   * fetch CAP note for the given sig and date, and format for display
   */
  // TODO: see how I can add type checking to this
  let currentCAPNote = await fetchCAPNote(sigAbbrev, project, date);

  // sort issues and practices by last edited date
  currentCAPNote.pastIssues.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
  currentCAPNote.currentIssues.sort((a, b) => {
    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
  });
  currentCAPNote.trackedPractices.sort((a, b) => {
    return new Date(b.lastUpdated) - new Date(a.lastUpdated);
  });

  // flatten CAP note ObjectIds
  let currentCAPNoteFlattened = currentCAPNote.toJSON({
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  });

  // TODO: 04-30-24 this will probably change since the data model has changed
  // remove id from TextEntryObjects
  const stripIdFromTextEntry = (entry) => {
    return {
      id: entry.id.toString(),
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

  // remove id from FollowUpObjects
  const stripIdFromFollowUpObject = (followUpObject) => {
    return {
      id: followUpObject.id.toString(),
      practice: followUpObject.practice,
      parsedPractice: {
        id: followUpObject.parsedPractice.id.toString(),
        practice: followUpObject.parsedPractice.practice,
        opportunity: followUpObject.parsedPractice.opportunity,
        person: followUpObject.parsedPractice.person,
        reflectionQuestions:
          followUpObject.parsedPractice.reflectionQuestions.map((question) => {
            return {
              id: question.id.toString(),
              prompt: question.prompt,
              responseType: question.responseType
            };
          })
      },
      outcome: {
        id: followUpObject.outcome.id.toString(),
        didHappen: followUpObject.outcome.didHappen,
        deliverableLink: followUpObject.outcome.deliverableLink,
        reflections: followUpObject.outcome.reflections.map((reflection) => {
          return {
            id: reflection.id.toString(),
            prompt: reflection.prompt,
            response: reflection.response
          };
        })
      }
    };
  };

  // remove id from IssueObjects
  const stripIdFromIssueObject = (issue) => {
    return {
      id: issue.id.toString(),
      date: longDate(issue.date),
      context: issue.context.map((textEntry) => {
        return stripIdFromTextEntry(textEntry);
      }),
      assessment: issue.assessment.map((textEntry) => {
        return stripIdFromTextEntry(textEntry);
      }),
      plan: issue.plan.map((textEntry) => {
        return stripIdFromTextEntry(textEntry);
      }),
      followUps: issue.followUps.map((followUp) => {
        return stripIdFromFollowUpObject(followUp);
      })
    };
  };

  // remove id from PracticeObjects (and subissues)
  const stripIdFromPracticeObject = (practice) => {
    return {
      id: practice.id.toString(),
      title: practice.title,
      description: practice.description,
      lastUpdated: longDate(practice.lastUpdated),
      practiceInactive: practice.practiceInactive,
      practiceArchived: practice.practiceArchived,
      currentInstance:
        practice.currentInstance == null
          ? null
          : stripIdFromIssueObject(practice.currentInstance),
      priorInstances: practice.priorInstances.map((instance) => {
        return stripIdFromIssueObject(instance);
      })
    };
  };

  const serializeDates = (object) => {
    return {
      ...object,
      date: longDate(object.date),
      lastUpdated: longDate(object.lastUpdated)
    };
  };

  // create data object for display
  const capNoteInfo = {
    id: currentCAPNoteFlattened.id,
    project: currentCAPNoteFlattened.project,
    sigName: currentCAPNoteFlattened.sigName,
    sigAbbreviation: currentCAPNoteFlattened.sigAbbreviation,
    sigDate: shortDate(currentCAPNoteFlattened.date),
    lastUpdated: longDate(currentCAPNoteFlattened.lastUpdated, true),
    context: currentCAPNoteFlattened.context,
    assessment: currentCAPNoteFlattened.assessment,
    plan: currentCAPNoteFlattened.plan,
    pastIssues: currentCAPNoteFlattened.pastIssues.map((issue) => {
      return {
        ...serializeDates(issue),
        priorInstances: issue.priorInstances.map((instance) => {
          return serializeDates(instance);
        })
      };
    }),
    currentIssues: currentCAPNoteFlattened.currentIssues.map((issue) => {
      return {
        ...serializeDates(issue),
        priorInstances: issue.priorInstances.map((instance) => {
          return serializeDates(instance);
        })
      };
    }),
    trackedPractices: currentCAPNoteFlattened.trackedPractices.map(
      (practice) => {
        return {
          ...serializeDates(practice),
          priorInstances: practice.prevIssues.map((issueInstance) => {
            return serializeDates(issueInstance);
          })
        };
      }
    )
  };

  console.log('capNoteInfo', capNoteInfo);

  // if any section has no data, add a placeholder line
  const addPlaceholderLine = (section) => {
    if (capNoteInfo[section].length === 0) {
      capNoteInfo[section].push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: [],
        value: ''
      });
    }
  };
  addPlaceholderLine('context');
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
        body: JSON.stringify({ projectName: currentCAPNote.project })
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
        projectName: currentCAPNote.project
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
    let titleIndex = capNoteInfo.context.findIndex(
      (line) => line.value === title
    );

    if (titleIndex === -1) {
      capNoteInfo.context.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'script',
        context: [],
        value: title
      });
    }
  }

  // sort context notes by [detected issues] first
  capNoteInfo.context.sort((a, b) => {
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
    context: capNoteInfo.context,
    assessment: capNoteInfo.assessment,
    plan: capNoteInfo.plan,
    pastIssues: capNoteInfo.pastIssues,
    currentIssues: capNoteInfo.currentIssues,
    practices: capNoteInfo.trackedPractices
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
      // TODO: what are other kinds of self-regulation strategies / buckets
      '[': ['plan]: ', 'help]: ', 'reflect]: ', 'self-work]: '],
      'w/': ['mentor', 'peer', 'self'],
      'rep/': [
        'problem statement',
        'design argument',
        'interface argument',
        'system argument',
        'user testing plan',
        'testing takeaways',
        'approach tree',
        'sketch a journey map / storyboard',
        '', // empty string for no representation
        'write: ',
        'reflect on: '
      ],
      '@': ['mysore', 'pair research', 'office hours', 'sig']
    }
  };

  // print before returning
  // console.log('capNoteInfo', JSON.stringify(capNoteInfo, null, 4));
  // console.log('data', data);
  // console.log('autocompleteTriggersOptions', autocompleteTriggersOptions);

  // TODO: 03-03-24 -- data might be redundant with the capNoteInfo
  return {
    props: { capNoteInfo: capNoteInfo, data, autocompleteTriggersOptions }
  };
};
