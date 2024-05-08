import type { GetServerSideProps } from 'next';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import mongoose from 'mongoose';
import { mutate } from 'swr';

import { fetchCAPNote } from '../../controllers/capNotes/fetchCAPNotes';
import CurrWeekIssueCard from '../../components/CurrWeekIssueCard';
import CurrWeekIssuePane from '../../components/CurrWeekIssuePane';
import PracticeGapCard from '../../components/PracticeGapCard';
import { longDate, shortDate } from '../../lib/helperFns';

import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon';
import ExclamationCircleIcon from '@heroicons/react/24/outline/ExclamationCircleIcon';

import { Tooltip } from 'flowbite-react';
import NoteBlock from '../../components/NoteBlock';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import LastWeekIssueCard from '../../components/LastWeekIssueCard';
import LastWeekIssuePane from '../../components/LastWeekIssuePane';

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

  // hold a state for showing / hiding last week's issue details
  const [showLastWeeksIssues, setShowLastWeeksIssues] = useState(true);

  // hold a state for showing / hiding practice gap details
  const [showPracticeGaps, setShowPracticeGaps] = useState(false);

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
        pastIssues: capData.pastIssues ?? [],
        currentIssues: capData.currentIssues ?? [],
        trackedPractices: capData.trackedPractices ?? []
      });

      /*
       * Parse pastIssues for saving
       */
      dataToSave.pastIssues.forEach((issue) => {
        // replace date objects
        issue.date = new Date(issue.date);
        issue.lastUpdated = new Date(issue.lastUpdated);

        // // replace all prior instances' dates with date objects
        // issue.priorInstances.forEach((instance) => {
        //   instance.date = new Date(instance.date);
        //   instance.lastUpdated = new Date(instance.date);
        // });
      });

      /*
       * Parse currentIssues for saving
       */
      dataToSave.currentIssues.forEach((issue) => {
        // replace date objects
        issue.date = new Date(issue.date);
        issue.lastUpdated = new Date(issue.lastUpdated);

        // // replace all prior instances' dates with date objects
        // issue.priorInstances.forEach((instance) => {
        //   instance.date = new Date(instance.date);
        //   instance.lastUpdated = new Date(instance.date);
        // });
      });

      /*
       * Parse trackedPractices for saving
       */
      dataToSave.trackedPractices.forEach((practice) => {
        // replace date objects
        practice.date = new Date(practice.date);
        practice.lastUpdated = new Date(practice.lastUpdated);

        // replace all prior instances' dates with date objects
        practice.prevIssues.forEach((instance) => {
          instance.date = new Date(instance.date);
          instance.lastUpdated = new Date(instance.date);
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
        <title>
          {`${
            noteInfo.project.length > 15
              ? noteInfo.project.substring(0, 15 - 3) + '...'
              : noteInfo.project
          } | ${new Date(noteInfo.sigDate).toLocaleString().split(',')[0]}`}
        </title>
      </Head>

      {/* Header info for SOAP note */}
      <div className="w-11/12 mx-auto mt-3">
        {/* Back, title, and last updated */}
        <div className="flex flex-row items-center flex-nowrap mb-4">
          {/* Back button */}
          <div className="mr-2">
            <Link href="/">
              <Tooltip content="Back to all notes" placement="bottom">
                <h3 className="text-lg font-bold text-blue-600 hover:text-blue-800 visited:text-purple-600">
                  &#8592;
                </h3>
              </Tooltip>
            </Link>
          </div>

          {/* Title */}
          <div className="mr-2">
            <h1 className="font-bold text-3xl mb-1">
              {noteInfo.project} | {noteInfo.sigDate}
            </h1>
          </div>

          {/* Save status */}
          {/* Three states of saved: (1) saved without error; (2) saving; (3) save attemped but error */}
          <div className="flex flex-row">
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

        <DndProvider backend={HTML5Backend}>
          {/* Past issues and tracked practices fixed to top of page */}
          {/* TODO: 05-06-24: maybe add a hide and show button so mentor can recover vertical space when done browsing past issues */}
          <div className="fixed w-11/12">
            <div className="flex flex-row mr-7">
              {/* Past Issues */}
              <div className="w-1/2 mr-2 mb-5">
                {/* Section title and description */}
                <div className="flex flex-col">
                  <h1 className="font-bold text-2xl border-b border-black mb-2">
                    Last Week&apos;s Issues
                  </h1>
                  <p className="italic text-sm mb-2">
                    {capData.pastIssues.length > 0
                      ? "Click on an issue to view it's assessments and follow-up outcomes."
                      : 'No issues from the past week.'}
                  </p>
                </div>

                {/* Issues from the past week */}
                <div className="flex flex-row gap-1 flex-nowrap overflow-auto">
                  {capData.pastIssues.map((lastWeekIssue) => (
                    <LastWeekIssueCard
                      key={`issue-card-${lastWeekIssue.id}`}
                      issueId={lastWeekIssue.id}
                      title={lastWeekIssue.title}
                      date={lastWeekIssue.date}
                      selectedIssue={selectedIssue}
                      setSelectedIssue={setSelectedIssue}
                      onDrag={(sourceIssueId, targetIssueId) => {
                        // find index of the source issue
                        let sourceIssueIndex = capData.pastIssues.findIndex(
                          (issue) => issue.id === sourceIssueId
                        );
                        let sourcePastIssue =
                          capData.pastIssues[sourceIssueIndex];

                        // check that the targetIssueId is add-practice
                        if (targetIssueId === 'add-practice') {
                          // add the source issue to the current issues
                          setCAPData((prevCapData) => {
                            let newCAPData = { ...prevCapData };
                            newCAPData.currentIssues.push({
                              id: new mongoose.Types.ObjectId().toString(),
                              title: capData.pastIssues[sourceIssueIndex].title,
                              date: longDate(new Date()),
                              lastUpdated: longDate(new Date()),
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
                              followUps: [],
                              priorInstances: [] // TODO: 04-30-24 add the source issue to the prior instances
                            });
                            return newCAPData;
                          });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Current Issues */}
              <div className="w-1/2 ml-2 mb-5">
                {/* Section title and description */}
                <div className="flex flex-col">
                  <h1 className="font-bold text-2xl border-b border-black mb-2">
                    Current Issues
                  </h1>
                  <p className="italic text-sm mb-2">
                    Click on an issue to edit it&apos;s CAP notes. Drag a Last
                    Week Issue or a note onto the last card to create a new
                    issue.
                  </p>
                </div>

                {/* This week's issues */}
                <div className="flex flex-row gap-1 flex-nowrap overflow-auto">
                  {/* Default card for the scratch space */}
                  <CurrWeekIssueCard
                    key="issue-card-this-weeks-notes"
                    issueId="this-weeks-notes"
                    issue={null}
                    selectedIssue={selectedIssue}
                    setSelectedIssue={setSelectedIssue}
                    editable={false}
                    onAddIssue={() => {
                      return;
                    }}
                    onDeleteIssue={() => {
                      return;
                    }}
                  />

                  {/* Current Issues */}
                  {capData.currentIssues.map((currIssue) => (
                    <CurrWeekIssueCard
                      key={`issue-card-${currIssue.id}`}
                      issueId={currIssue.id}
                      issue={currIssue}
                      selectedIssue={selectedIssue}
                      setSelectedIssue={setSelectedIssue}
                      onAddIssue={() => {
                        return;
                      }}
                      onDeleteIssue={(issueId) => {
                        // confirm if the user wants to delete the issue
                        if (
                          !confirm(
                            `Are you sure you want to delete, "${currIssue.title}"? This cannot be undone.`
                          )
                        ) {
                          return;
                        }

                        // reset the selected issue
                        // delete the issue
                        let issuesToUpdate = capData.currentIssues;
                        let issueIndex = issuesToUpdate.findIndex(
                          (i) => i.id === issueId
                        );
                        issuesToUpdate.splice(issueIndex, 1);

                        setCAPData((prevData) => {
                          // TODO: 05-06-24: creates a race condition if the current issue is is highlighted when being deleted
                          setSelectedIssue('this-weeks-notes');
                          return {
                            ...prevData,
                            currentIssues: issuesToUpdate
                          };
                        });
                      }}
                      onTitleEdit={(newTitle) => {
                        // update the title of the issue
                        let issuesToUpdate = capData.currentIssues;
                        let issueIndex = issuesToUpdate.findIndex(
                          (i) => i.id === currIssue.id
                        );
                        issuesToUpdate[issueIndex].title = newTitle;
                        setCAPData((prevData) => ({
                          ...prevData,
                          currentIssues: issuesToUpdate
                        }));
                      }}
                    />
                  ))}

                  {/* Create a new issue for the week */}
                  <CurrWeekIssueCard
                    key="issue-card-add-practice"
                    issueId="add-practice"
                    issue={null}
                    selectedIssue={selectedIssue}
                    setSelectedIssue={setSelectedIssue}
                    onAddIssue={(newIssueTitle) => {
                      // create a new issue for the current week
                      let newIssueForWeek = {
                        id: new mongoose.Types.ObjectId().toString(),
                        title: newIssueTitle,
                        date: longDate(new Date(noteInfo.sigDate)),
                        lastUpdated: longDate(new Date()),
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
                        followUps: [],
                        priorInstances: []
                      };

                      setCAPData((prevCapData) => {
                        let newCAPData = { ...prevCapData };
                        newCAPData.currentIssues.push(newIssueForWeek);
                        return newCAPData;
                      });
                    }}
                    onDeleteIssue={() => {
                      return;
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder div to push down the non-fixed portion */}
          <div className="h-[25vh]" />

          {/* Note Space */}
          <div className="flex flex-col h-[65vh] overflow-auto">
            {/* show either the CAP note section for scratch space or current issues, or the summary interface for last week's issue */}
            {/* TODO: should check if the issue id is in the current issues or past issues */}
            <div className="">
              {selectedIssue !== null &&
              selectedIssue !== 'this-weeks-notes' ? (
                capData.currentIssues.findIndex(
                  (practice) => practice.id === selectedIssue
                ) !== -1 ? (
                  // Selected issue is a current week issue
                  <>
                    {/* TODO: title should change based on what practice is selected */}
                    {/* TODO: for issues, allow the title to be edited */}
                    {/* TODO: once this uses the same schema as the regular notes, then the code can be compressed */}
                    <h1 className="font-bold text-2xl border-b border-black mb-3 bg-white sticky top-0">
                      {capData.currentIssues.findIndex(
                        (practice) => practice.id === selectedIssue
                      ) !== -1 &&
                        capData.currentIssues[
                          capData.currentIssues.findIndex(
                            (practice) => practice.id === selectedIssue
                          )
                        ].title}
                    </h1>

                    <p className="italic text-sm">
                      Use the space below to add notes for the selected issue.
                    </p>

                    <p className="italic text-sm text-slate-500 mb-2">
                      Press Shift-Enter to add a new text block and
                      Shift-Backspace to delete current block. Press Tab to move
                      to next block, and Shift-Tab to move to previous block.
                    </p>

                    <CurrWeekIssuePane
                      issueId={selectedIssue}
                      capData={capData}
                      setCAPData={setCAPData} // TODO: this needs to be per issue
                      capSections={issueSections}
                      showPracticeGaps={showPracticeGaps}
                      setShowPracticeGaps={setShowPracticeGaps}
                      autocompleteTriggersOptions={autocompleteTriggersOptions}
                    />
                  </>
                ) : (
                  // Selected issue is a last week issue
                  <>
                    <h1 className="font-bold text-2xl border-b border-black mb-3 bg-white sticky top-0">
                      {capData.pastIssues.findIndex(
                        (issue) => issue.id === selectedIssue
                      ) !== -1 &&
                        capData.pastIssues[
                          capData.pastIssues.findIndex(
                            (practice) => practice.id === selectedIssue
                          )
                        ].title}
                    </h1>

                    <p className="italic text-sm">
                      Use the space below to add notes for the selected issue.
                    </p>

                    <p className="italic text-sm text-slate-500 mb-2">
                      Press Shift-Enter to add a new text block and
                      Shift-Backspace to delete current block. Press Tab to move
                      to next block, and Shift-Tab to move to previous block.
                    </p>

                    <LastWeekIssuePane
                      issueId={selectedIssue}
                      capData={capData}
                      setCAPData={setCAPData} // TODO: this needs to be per issue
                      capSections={issueSections}
                    />
                  </>
                )
              ) : (
                <div>
                  <h1 className="font-bold text-2xl border-b border-black mb-3 bg-white sticky top-0">
                    Scratch Space
                  </h1>

                  {/* TODO: show only for the default note; for issues, replace with an editable description */}
                  <p className="italic text-sm">
                    Use the space below to scratch notes during SIG meeting.
                    Attach notes to Current Issues by dragging them onto the
                    cards above, or create an issue by using the last card.
                  </p>

                  <p className="italic text-sm text-slate-500 mb-2">
                    Press Shift-Enter to add a new text block and
                    Shift-Backspace to delete current block. Press Tab to move
                    to next block, and Shift-Tab to move to previous block.
                  </p>

                  {/* Create section for each part of the CAP notes */}
                  {notetakingSections.map((section) => (
                    <div className="w-full mb-4" key={section.name}>
                      <h1 className="font-bold text-xl">{section.title}</h1>
                      {section.name === 'plan' && (
                        <h2 className="text-sm italic color-grey">
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
                                // stop default behavior of enter key if enter + shift OR shift + backspace are pressed
                                if (
                                  (e.key === 'Enter' && e.shiftKey) ||
                                  ((e.key === 'Backspace' ||
                                    e.key === 'Delete') &&
                                    e.shiftKey)
                                ) {
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
                                } else if (
                                  (e.key === 'Backspace' ||
                                    e.key === 'Delete') &&
                                  e.shiftKey
                                ) {
                                  // remove line
                                  // add new line underneath the current line
                                  setCAPData((prevCAPData) => {
                                    let newCAPData = { ...prevCAPData };

                                    // find that line that was edited in the current instance of the practice
                                    let lineIndex = newCAPData[
                                      section.name
                                    ].findIndex((l) => l.id === line.id);

                                    // remove line
                                    newCAPData[section.name] = newCAPData[
                                      section.name
                                    ].filter((l) => l.id !== line.id);

                                    // if the section is empty, add a new empty block
                                    if (newCAPData[section.name].length === 0) {
                                      newCAPData[section.name].push({
                                        id: new mongoose.Types.ObjectId().toString(),
                                        type: 'note',
                                        context: [],
                                        value: ''
                                      });
                                    }

                                    return newCAPData;
                                  });
                                }
                              }}
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
                                issueId,
                                noteSection,
                                noteBlock
                              ) => {
                                // check that the content is not empty before allowing drag
                                if (noteBlock.value.trim() === '') {
                                  return;
                                }

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

                                // create a new issue add issue
                                if (
                                  issueId === 'add-practice' ||
                                  issueId === 'this-weeks-notes'
                                ) {
                                  // create a new issue
                                  let newIssue = {
                                    id: new mongoose.Types.ObjectId().toString(),
                                    title: noteBlock.value
                                      .trim()
                                      .replace(/<\/?[^>]+(>|$)/g, ''),
                                    date: longDate(new Date(noteInfo.sigDate)),
                                    lastUpdated: longDate(new Date()),
                                    context: editsToIssue['context'],
                                    assessment: editsToIssue['assessment'],
                                    plan: editsToIssue['plan'],
                                    priorInstances: []
                                  };

                                  setCAPData((prevCapData) => {
                                    let newCAPData = { ...prevCapData };
                                    newCAPData.currentIssues.push(newIssue);
                                    return newCAPData;
                                  });

                                  issueId = newIssue.id;
                                }
                                // otherwise, add data to the practice
                                else {
                                  // find the practice
                                  let issueIndex =
                                    capData.currentIssues.findIndex(
                                      (practice) => practice.id === issueId
                                    );
                                  let issueInstance =
                                    capData.currentIssues[issueIndex];

                                  // create a new issue instance for the issue if it doesn't exist
                                  if (issueInstance === null) {
                                    // if the current instance doesn't exist, intialize it with the additions from the notetaking space
                                    issueInstance = {
                                      id: new mongoose.Types.ObjectId().toString(),
                                      date: longDate(
                                        new Date(noteInfo.sigDate)
                                      ),
                                      lastUpdated: longDate(new Date()),
                                      context: editsToIssue['context'],
                                      assessment: editsToIssue['summary'],
                                      plan: editsToIssue['plan'],
                                      followUps: [],
                                      priorInstances: []
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
                                    issueInstance.lastUpdated = longDate(
                                      new Date()
                                    );
                                  }

                                  // update state variable
                                  setCAPData((prevCAPData) => {
                                    let newCAPData = { ...prevCAPData };
                                    newCAPData.currentIssues[issueIndex] =
                                      issueInstance;
                                    newCAPData.currentIssues[
                                      issueIndex
                                    ].lastUpdated = longDate(new Date());

                                    return newCAPData;
                                  });

                                  issueId =
                                    capData.currentIssues[issueIndex].id;
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

                          {section.name === 'assessment' && (
                            <div className="w-full">
                              {/* Practice Cards */}
                              <div className="mb-5">
                                <div className="flex flex-row items-center">
                                  <h1 className="font-bold text-lg">
                                    Tracked Practice Gaps
                                  </h1>
                                  <button
                                    className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 h-6 rounded-full ml-2"
                                    onClick={() => {
                                      setShowPracticeGaps(!showPracticeGaps);
                                    }}
                                  >
                                    {showPracticeGaps
                                      ? 'Hide details'
                                      : 'Show details'}
                                  </button>
                                </div>
                                <p className="italic text-sm mb-2">
                                  Drag a practice onto the assessment to add it
                                  to the current issue. Edit a practice gap by
                                  clicking on its title or description.
                                </p>

                                {/* Active Practices */}
                                <div className="flex flex-row gap-2 flex-nowrap overflow-auto">
                                  {/* tracked practices */}
                                  {capData.trackedPractices
                                    .filter((practice) => {
                                      return (
                                        !practice.practiceInactive &&
                                        !practice.practiceArchived
                                      );
                                    })
                                    .map((practice) => (
                                      <PracticeGapCard
                                        key={`issue-card-${practice.id}`}
                                        issueId={practice.id}
                                        title={practice.title}
                                        description={practice.description}
                                        lastUpdated={practice.lastUpdated}
                                        priorInstances={practice.prevIssues}
                                        issueIsResolved={false}
                                        showPracticeGaps={showPracticeGaps}
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
                                          let practiceToUpdate =
                                            capData.trackedPractices;
                                          let practiceIndex =
                                            practiceToUpdate.findIndex(
                                              (i) => i.id === practice.id
                                            );
                                          practiceToUpdate[
                                            practiceIndex
                                          ].practiceInactive = true;
                                          practiceToUpdate[
                                            practiceIndex
                                          ].lastUpdated = longDate(new Date());
                                          setCAPData((prevData) => ({
                                            ...prevData,
                                            trackedPractices: practiceToUpdate
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
                                          let practiceToUpdate =
                                            capData.trackedPractices;
                                          let practiceIndex =
                                            practiceToUpdate.findIndex(
                                              (i) => i.id === practice.id
                                            );
                                          practiceToUpdate[
                                            practiceIndex
                                          ].practiceArchived = true;
                                          practiceToUpdate[
                                            practiceIndex
                                          ].lastUpdated = longDate(new Date());
                                          setCAPData((prevData) => ({
                                            ...prevData,
                                            trackedPractices: practiceToUpdate
                                          }));
                                        }}
                                        onEdit={(field, edits) => {
                                          // update the practice with the edits
                                          let practiceToUpdate =
                                            capData.trackedPractices;
                                          let practiceIndex =
                                            practiceToUpdate.findIndex(
                                              (i) => i.id === practice.id
                                            );
                                          practiceToUpdate[practiceIndex][
                                            field
                                          ] = edits;
                                          practiceToUpdate[
                                            practiceIndex
                                          ].lastUpdated = longDate(new Date());
                                          setCAPData((prevData) => ({
                                            ...prevData,
                                            trackedPractices: practiceToUpdate
                                          }));
                                        }}
                                        onDrag={(
                                          sourcePracticeId,
                                          targetCurrentIssueId
                                        ) => {
                                          // find index of the source practice
                                          let sourcePracticeIndex =
                                            capData.trackedPractices.findIndex(
                                              (practice) =>
                                                practice.id === sourcePracticeId
                                            );
                                          let sourcePractice =
                                            capData.trackedPractices[
                                              sourcePracticeIndex
                                            ];

                                          // find the target issue index
                                          let targetIssueIndex =
                                            capData.currentIssues.findIndex(
                                              (issue) =>
                                                issue.id ===
                                                targetCurrentIssueId
                                            );
                                          let targetIssue =
                                            capData.currentIssues[
                                              targetIssueIndex
                                            ];

                                          // update state
                                          setCAPData((prevCapData) => {
                                            let newCAPData = { ...prevCapData };

                                            // attach practice to targetIssue as an assessment
                                            let newAssessment = {
                                              id: new mongoose.Types.ObjectId().toString(),
                                              type: 'note',
                                              context: [],
                                              value: `[practice gap] ${sourcePractice.title}`
                                            };

                                            // check if last assessment is blank before adding
                                            if (
                                              targetIssue.assessment.length ===
                                                1 &&
                                              targetIssue.assessment[0].value.trim() ===
                                                ''
                                            ) {
                                              newCAPData.currentIssues[
                                                targetIssueIndex
                                              ].assessment = [newAssessment];
                                            } // check if the last assessment is blank
                                            else if (
                                              newCAPData.currentIssues[
                                                targetIssueIndex
                                              ].assessment[
                                                newCAPData.currentIssues[
                                                  targetIssueIndex
                                                ].assessment.length - 1
                                              ].value.trim() === ''
                                            ) {
                                              newCAPData.currentIssues[
                                                targetIssueIndex
                                              ].assessment[
                                                newCAPData.currentIssues[
                                                  targetIssueIndex
                                                ].assessment.length - 1
                                              ] = newAssessment;
                                            } else {
                                              newCAPData.currentIssues[
                                                targetIssueIndex
                                              ].assessment.push(newAssessment);
                                            }

                                            // update the last updated timestamp
                                            newCAPData.currentIssues[
                                              targetIssueIndex
                                            ].lastUpdated = longDate(
                                              new Date()
                                            );

                                            // attach the current issue as an instance to the practice
                                            let newIssueInstance = {
                                              id: targetIssue.id,
                                              title: targetIssue.title,
                                              date: targetIssue.date,
                                              lastUpdated:
                                                targetIssue.lastUpdated
                                            };
                                            newCAPData.trackedPractices[
                                              sourcePracticeIndex
                                            ].prevIssues.push(targetIssue);

                                            // return the new data
                                            return newCAPData;
                                          });
                                        }}
                                      />
                                    ))}

                                  {/* practice card for new practice gaps */}
                                  <PracticeGapCard
                                    key="issue-card-add-practice"
                                    issueId="add-practice"
                                    title="Add practice"
                                    description="Notes from SIG"
                                    lastUpdated={noteInfo.lastUpdated}
                                    issueIsResolved={false}
                                    onAddPractice={(practiceTitle) => {
                                      // create a new practice
                                      let newPractice = {
                                        id: new mongoose.Types.ObjectId().toString(),
                                        title: practiceTitle,
                                        description: '',
                                        date: longDate(new Date()),
                                        lastUpdated: longDate(new Date()),
                                        practiceInactive: false,
                                        practiceArchived: false,
                                        prevIssues: []
                                      };

                                      setCAPData((prevCapData) => {
                                        let newCAPData = { ...prevCapData };
                                        newCAPData.trackedPractices.push(
                                          newPractice
                                        );
                                        return newCAPData;
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Add helper text on how to use the plan section */}
                          {section.name === 'plan' && (
                            <>
                              <div className="text-sm text-gray-700 italic mt-2 flex flex-row">
                                {/* Kinds of practice agents */}
                                <div className="mr-2 align-top basis-1/4">
                                  <h2 className="font-bold">
                                    Issue follow-ups
                                  </h2>
                                  <div>
                                    <p>
                                      <span className="font-semibold">
                                        [plan]:
                                      </span>{' '}
                                      stories, deliverables, or tasks to add to
                                      sprint log
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        [help]:
                                      </span>{' '}
                                      work with a peer or mentor on practice
                                    </p>
                                  </div>
                                </div>

                                <div className="mr-6 align-top basis-1/4">
                                  <h2 className="font-bold">&nbsp;</h2>
                                  <div>
                                    <p>
                                      <span className="font-semibold">
                                        [reflect]:
                                      </span>{' '}
                                      reflect on a situation if it comes up
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        [self-work]:
                                      </span>{' '}
                                      work activity for student to do on their
                                      own
                                    </p>
                                  </div>
                                </div>

                                {/* Additional info to attach */}
                                <div className="mr-2 align-top basis-1/4">
                                  <h2 className="font-bold">
                                    Include additional info with...
                                  </h2>
                                  <div>
                                    {/* what (practice), who, where / when, how */}
                                    <p>
                                      <span className="font-semibold">
                                        w/[person, person]:
                                      </span>{' '}
                                      who the practice should be done with
                                    </p>
                                    <p>
                                      <span className="font-semibold">
                                        @[venue]:
                                      </span>{' '}
                                      specific venue to do the practice; CAP
                                      will follow-up at the next one.
                                    </p>
                                  </div>
                                </div>

                                <div className="align-top basis-1/4">
                                  <h2 className="font-bold">&nbsp;</h2>
                                  <div>
                                    {/* what (practice), who, where / when, how */}
                                    <p>
                                      <span className="font-semibold">
                                        rep/[representation]:
                                      </span>{' '}
                                      representation to use for practice (e.g.,
                                      canvas section; sketch of a journey map;
                                      reflection question(s))
                                    </p>
                                  </div>
                                </div>
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

        {/* Issue Cards and SOAP Notes */}
        <DndProvider backend={HTML5Backend}></DndProvider>
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

  // serialize date objects
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
        ...serializeDates(issue)
      };
    }),
    currentIssues: currentCAPNoteFlattened.currentIssues.map((issue) => {
      return {
        ...serializeDates(issue)
      };
    }),
    trackedPractices: currentCAPNoteFlattened.trackedPractices.map(
      (practice) => {
        return {
          ...serializeDates(practice),
          prevIssues: practice.prevIssues.map((issueInstance) => {
            return serializeDates(issueInstance);
          })
        };
      }
    )
  };

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

  // /**
  //  * get active issues from OS
  //  */
  // let activeIssues;
  // try {
  //   const res = await fetch(
  //     `${
  //       process.env.ORCH_ENGINE
  //     }/activeIssues/fetchActiveIssuesForProject?${new URLSearchParams({
  //       projectName: currentCAPNote.project
  //     })}`
  //   );
  //   activeIssues = await res.json();
  // } catch (err) {
  //   console.error(err);
  // }

  // // TODO: 03-03-24 -- see if I can filter out actionable followups and get some context separately
  // // get only issues and follow-ups for next SIG
  // const triggeredScripts = activeIssues
  //   .filter(
  //     (issue) =>
  //       !issue.name.includes('actionable follow-up') ||
  //       (issue.name.includes('actionable follow-up') &&
  //         (issue.name.includes('morning of next SIG') ||
  //           issue.name.includes('at next SIG')))
  //   )
  //   .map((script) => {
  //     return {
  //       name: script.name,
  //       type: script.name.includes('follow-up') ? 'follow-up' : 'issue',
  //       strategies: script.computed_strategies[0].outlet_args.message
  //     };
  //   });

  // // add active issues to SOAP notes
  // for (let script of triggeredScripts) {
  //   let scriptType = '';
  //   switch (script.type) {
  //     case 'follow-up':
  //       scriptType = 'follow-up';
  //       break;
  //     case 'practice':
  //       scriptType = 'practice';
  //       break;
  //     case 'issue':
  //     default:
  //       scriptType = 'detected issue';
  //   }
  //   let title =
  //     scriptType == 'follow-up'
  //       ? `[${scriptType}] ${script.strategies}`
  //       : `[${scriptType}] ${script.name} - ${script.strategies}`;
  //   let titleIndex = capNoteInfo.context.findIndex(
  //     (line) => line.value === title
  //   );

  //   if (titleIndex === -1) {
  //     capNoteInfo.context.push({
  //       id: new mongoose.Types.ObjectId().toString(),
  //       type: 'script',
  //       context: [],
  //       value: title
  //     });
  //   }
  // }

  // // sort context notes by [detected issues] first
  // capNoteInfo.context.sort((a, b) => {
  //   if (a.type === 'script' && b.type !== 'script') {
  //     return -1;
  //   } else {
  //     return 1;
  //   }
  // });

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
    trackedPractices: capNoteInfo.trackedPractices
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
  console.log('capNoteInfo', capNoteInfo);
  console.log('capNoteInfo', JSON.stringify(capNoteInfo, null, 2));
  console.log('data', data);
  console.log('autocompleteTriggersOptions', autocompleteTriggersOptions);

  // TODO: 03-03-24 -- data might be redundant with the capNoteInfo
  return {
    props: { capNoteInfo: capNoteInfo, data, autocompleteTriggersOptions }
  };
};
