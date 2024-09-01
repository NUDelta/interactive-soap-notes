import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { longDate } from '../lib/helperFns';

import NoteBlock from './NoteBlock';
import mongoose from 'mongoose';
import PracticeGapCard from './PracticeGapCard';
import { useState } from 'react';
import { createNewTextEntryBlock } from '../controllers/textEntryBlock/createNewTextEntryBlock';
import NoteBlockForPlan from './NoteBlockForPlan';

export default function CurrWeekIssuePane({
  issueId,
  project,
  sig,
  date,
  currentIssuesData,
  setCurrentIssuesData,
  practiceGapData,
  setPracticeGapData
}): JSX.Element {
  // get the issue from soapData with the given issueId
  const issueIndex = currentIssuesData.findIndex(
    (practice) => practice.id === issueId
  );
  const currIssue = currentIssuesData[issueIndex];
  let priorInstances = [];
  if (currIssue && currIssue.priorInstances) {
    priorInstances = currIssue.priorInstances;
  }

  // store note sections
  const capSections = [
    {
      name: 'context',
      title: 'Context: what are you observing related to this issue?'
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

  // state variable for showing practice gaps
  const [showPracticeGaps, setShowPracticeGaps] = useState(
    'Show Gaps with Details'
  );

  return (
    <div className="mb-5">
      {currIssue && (
        <div className="flex w-full flex-wrap overflow-auto">
          <div className="w-full">
            {/* show if there is a current instance */}
            {capSections.map((section) => (
              <div className="mb-1 w-full" key={section.name}>
                <h1 className="text-base font-bold">{section.title}</h1>
                {/* Helper text for plan */}
                {section.name === 'plan' && (
                  <p className="color-grey text-xs italic">
                    Type <span className="font-bold">[</span> to add practices
                    using the autocomplete options; add additional info with{' '}
                    <span className="font-bold">w[</span>,
                    <span className="font-bold">at[</span>, or{' '}
                    <span className="font-bold">rep[</span> (details below).
                    Practices are sent to the students after SIG, and before
                    practice opportunities. Students will be asked to share
                    practices deliverables and reflections before the next SIG
                    meeting.
                  </p>
                )}

                {/* Helper text for assessment */}
                {section.name === 'assessment' && (
                  <p className="mb-1 text-xs italic">
                    Drag a self-regulation gap from below onto the issue card on
                    the top of the page to attach it.
                    {/* Drag a note onto the empty card to track a new gap. */}
                  </p>
                )}

                {/* Create section for each part of the CAP notes */}
                <div className="flex">
                  {/* Notetaking area */}
                  <div className="flex-auto">
                    {section.name !== 'plan' &&
                      currIssue[section.name].map((line) => (
                        <NoteBlock
                          key={`note-block-from-issuepane-${line.id}`}
                          noteSection={section.name}
                          noteId={line.id}
                          noteContent={line}
                          onKeyDown={(e) => {
                            // stop default behavior of enter key if enter + shift OR shift + backspace are pressed
                            if (
                              (e.key === 'Enter' && e.shiftKey) ||
                              ((e.key === 'Backspace' || e.key === 'Delete') &&
                                e.shiftKey)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onKeyUp={(e) => {
                            // store id of new line so it can be focused on
                            let newLineId;

                            // create a new object for the line
                            let newLine = createNewTextEntryBlock(
                              'note',
                              [],
                              '',
                              '',
                              true
                            );

                            // check for shift-enter to add a new line
                            if (e.key === 'Enter' && e.shiftKey) {
                              // add new line underneath the current line
                              setCurrentIssuesData((prevCurrentIssuesData) => {
                                let newCurrentIssuesData = [
                                  ...prevCurrentIssuesData
                                ];

                                // find that line that was edited in the current instance of the practice
                                let lineIndex = newCurrentIssuesData[
                                  issueIndex
                                ][section.name].findIndex(
                                  (l) => l.id === line.id
                                );

                                // check if the current line is empty
                                if (
                                  lineIndex ===
                                  newCurrentIssuesData[issueIndex][section.name]
                                    .length -
                                    1
                                ) {
                                  // don't add a new line if the current line is empty
                                  if (
                                    newCurrentIssuesData[issueIndex][
                                      section.name
                                    ][lineIndex].value.trim() === ''
                                  ) {
                                    newLineId =
                                      newCurrentIssuesData[issueIndex][
                                        section.name
                                      ][lineIndex].id;
                                    return newCurrentIssuesData;
                                  }
                                } else if (
                                  lineIndex + 1 <
                                  newCurrentIssuesData[issueIndex][section.name]
                                    .length
                                ) {
                                  // don't add a new line if the next line is already an empty block
                                  if (
                                    newCurrentIssuesData[issueIndex][
                                      section.name
                                    ][lineIndex + 1].value.trim() === ''
                                  ) {
                                    newLineId =
                                      newCurrentIssuesData[issueIndex][
                                        section.name
                                      ][lineIndex + 1].id;
                                    return newCurrentIssuesData;
                                  }
                                }

                                // otherwise, add to the list
                                newLineId = newLine.id;
                                newCurrentIssuesData[issueIndex][
                                  section.name
                                ].splice(lineIndex + 1, 0, newLine);

                                return newCurrentIssuesData;
                              });

                              // TODO: 04-23-24 this causes a race condition where the new line is not yet rendered
                              // could be fixed with a callback: https://github.com/the-road-to-learn-react/use-state-with-callback#usage
                              // have a useEffect just in the view component that sets the focus to the new line (with a didMount): https://stackoverflow.com/questions/56247433/how-to-use-setstate-callback-on-react-hooks
                              // set focus to added line if not undefined
                              // if (newLineId !== undefined) {
                              //   document.getElementById(newLineId).focus();
                              // }
                            } else if (
                              (e.key === 'Backspace' || e.key === 'Delete') &&
                              e.shiftKey
                            ) {
                              // remove line
                              // add new line underneath the current line
                              setCurrentIssuesData((prevCurrentIssuesData) => {
                                let newCurrentIssuesData = [
                                  ...prevCurrentIssuesData
                                ];

                                // find that line that was edited in the current instance of the practice
                                let lineIndex = newCurrentIssuesData[
                                  issueIndex
                                ][section.name].findIndex(
                                  (l) => l.id === line.id
                                );

                                // remove line
                                newCurrentIssuesData[issueIndex][section.name] =
                                  newCurrentIssuesData[issueIndex][
                                    section.name
                                  ].filter((l) => l.id !== line.id);

                                // if the section is empty, add a new empty block
                                if (
                                  newCurrentIssuesData[issueIndex][section.name]
                                    .length === 0
                                ) {
                                  newCurrentIssuesData[issueIndex][
                                    section.name
                                  ].push(newLine);
                                }

                                return newCurrentIssuesData;
                              });
                            }
                          }}
                          onChange={(htmlEdits, rawEdits) => {
                            // before attempting a save, check if the line is identical to the previous line (both trimmed)
                            rawEdits = rawEdits.trim();
                            if (rawEdits === line.value.trim()) {
                              return;
                            }

                            // save rawEdits to the correct line
                            setCurrentIssuesData((prevCurrentIssuesData) => {
                              // get the current data and correct line that was changed
                              let newCurrentIssuesData = [
                                ...prevCurrentIssuesData
                              ];
                              let lineIndex = newCurrentIssuesData[issueIndex][
                                section.name
                              ].findIndex((l) => l.id === line.id);

                              // save html and raw edits
                              newCurrentIssuesData[issueIndex][section.name][
                                lineIndex
                              ].html = htmlEdits;
                              newCurrentIssuesData[issueIndex][section.name][
                                lineIndex
                              ].value = rawEdits;

                              return newCurrentIssuesData;
                            });
                          }}
                          onDragToIssue={(
                            targetissueId,
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

                            // TODO: 04-23-24 -- case: what if note is dragged from practice to week's notes?
                            // create a new practice if the note is dragged into the add practice section
                            if (targetissueId === 'add-practice') {
                              // create a new issue
                              let newIssue = {
                                id: new mongoose.Types.ObjectId().toString(),
                                title: noteBlock.value
                                  .trim()
                                  .replace(/<\/?[^>]+(>|$)/g, ''),
                                date: new Date().toISOString(),
                                lastUpdated: new Date().toISOString(),
                                context: editsToIssue['context'],
                                assessment: editsToIssue['assessment'],
                                plan: editsToIssue['plan'],
                                priorInstances: []
                              };

                              setCAPData((prevCapData) => {
                                let newCAPData = { ...prevCapData };
                                newcurrentIssuesData.push(newIssue);
                                return newCAPData;
                              });

                              targetissueId = newIssue.id;
                            } else if (targetissueId === 'this-weeks-notes') {
                              // add the note to the general CAP note
                              setCAPData((prevCAPData) => {
                                let newCAPData = { ...prevCAPData };
                                newCAPData[noteSection] =
                                  newCAPData[noteSection].concat(noteBlock);

                                return newCAPData;
                              });
                            }
                            // otherwise, add data to the issue =
                            else {
                              // find the practice and its issue instance
                              let issueIndex = currentIssuesData.findIndex(
                                (practice) => practice.id === targetissueId
                              );
                              let issueInstance = currentIssuesData[issueIndex];

                              // create a new issue instance for the practice if it doesn't exist
                              if (issueInstance === null) {
                                // if the current instance doesn't exist, intialize it with the additions from the notetaking space
                                issueInstance = {
                                  id: new mongoose.Types.ObjectId().toString(),
                                  date: new Date().toISOString(),
                                  lastUpdated: new Date().toISOString(),
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
                                  issueInstance['assessment'].length === 1 &&
                                  issueInstance['assessment'][0].value === ''
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
                                issueInstance.date = new Date().toISOString();
                              }

                              setCAPData((prevCAPData) => {
                                let newCAPData = { ...prevCAPData };
                                newcurrentIssuesData[issueIndex] =
                                  issueInstance;
                                newcurrentIssuesData[issueIndex].lastUpdated =
                                  new Date().toISOString();

                                return newCAPData;
                              });

                              targetissueId = currentIssuesData[issueIndex].id;
                            }

                            // remove note block that was dragged into the issue from the practice it was dragged from
                            setCAPData((prevCAPData) => {
                              let newSoapData = { ...prevCAPData };

                              // get the practiceIndex of the practice the block was dragged from
                              let issueIndex =
                                newSoapData.currentIssues.findIndex(
                                  (practice) => practice.id === issueId
                                );

                              // remove the note block from the edited section
                              newSoapData.currentIssues[issueIndex][
                                noteSection
                              ] = newSoapData.currentIssues[issueIndex][
                                noteSection
                              ].filter((line) => line.id !== noteBlock.id);

                              // if the section is empty, add a new empty block
                              if (
                                newSoapData.currentIssues[issueIndex][
                                  noteSection
                                ].length === 0
                              ) {
                                newSoapData.currentIssues[issueIndex][
                                  noteSection
                                ].push({
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

                    {/* custom block for plan */}
                    {section.name === 'plan' &&
                      currIssue[section.name].map((line) => (
                        <NoteBlockForPlan
                          key={`note-block-from-issuepane-${line.id}`}
                          noteSection={section.name}
                          noteId={line.id}
                          noteContent={line}
                          onKeyDown={(e) => {
                            // stop default behavior of enter key if enter + shift OR shift + backspace are pressed
                            if (
                              (e.key === 'Enter' && e.shiftKey) ||
                              ((e.key === 'Backspace' || e.key === 'Delete') &&
                                e.shiftKey)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onKeyUp={(e) => {
                            // store id of new line so it can be focused on
                            let newLineId;

                            // create a new object for the line
                            let newLine = createNewTextEntryBlock(
                              'note',
                              [],
                              '',
                              '',
                              true
                            );

                            // check for shift-enter to add a new line
                            if (e.key === 'Enter' && e.shiftKey) {
                              // add new line underneath the current line
                              setCurrentIssuesData((prevCurrentIssuesData) => {
                                let newCurrentIssuesData = [
                                  ...prevCurrentIssuesData
                                ];

                                // find that line that was edited in the current instance of the practice
                                let lineIndex = newCurrentIssuesData[
                                  issueIndex
                                ][section.name].findIndex(
                                  (l) => l.id === line.id
                                );

                                // check if the current line is empty
                                if (
                                  lineIndex ===
                                  newCurrentIssuesData[issueIndex][section.name]
                                    .length -
                                    1
                                ) {
                                  // don't add a new line if the current line is empty
                                  if (
                                    newCurrentIssuesData[issueIndex][
                                      section.name
                                    ][lineIndex].value.trim() === ''
                                  ) {
                                    newLineId =
                                      newCurrentIssuesData[issueIndex][
                                        section.name
                                      ][lineIndex].id;
                                    return newCurrentIssuesData;
                                  }
                                } else if (
                                  lineIndex + 1 <
                                  newCurrentIssuesData[issueIndex][section.name]
                                    .length
                                ) {
                                  // don't add a new line if the next line is already an empty block
                                  if (
                                    newCurrentIssuesData[issueIndex][
                                      section.name
                                    ][lineIndex + 1].value.trim() === ''
                                  ) {
                                    newLineId =
                                      newCurrentIssuesData[issueIndex][
                                        section.name
                                      ][lineIndex + 1].id;
                                    return newCurrentIssuesData;
                                  }
                                }

                                // otherwise, add to the list
                                newLineId = newLine.id;
                                newCurrentIssuesData[issueIndex][
                                  section.name
                                ].splice(lineIndex + 1, 0, newLine);

                                return newCurrentIssuesData;
                              });

                              // TODO: 04-23-24 this causes a race condition where the new line is not yet rendered
                              // could be fixed with a callback: https://github.com/the-road-to-learn-react/use-state-with-callback#usage
                              // have a useEffect just in the view component that sets the focus to the new line (with a didMount): https://stackoverflow.com/questions/56247433/how-to-use-setstate-callback-on-react-hooks
                              // set focus to added line if not undefined
                              // if (newLineId !== undefined) {
                              //   document.getElementById(newLineId).focus();
                              // }
                            } else if (
                              (e.key === 'Backspace' || e.key === 'Delete') &&
                              e.shiftKey
                            ) {
                              // remove line
                              // add new line underneath the current line
                              setCurrentIssuesData((prevCurrentIssuesData) => {
                                let newCurrentIssuesData = [
                                  ...prevCurrentIssuesData
                                ];

                                // find that line that was edited in the current instance of the practice
                                let lineIndex = newCurrentIssuesData[
                                  issueIndex
                                ][section.name].findIndex(
                                  (l) => l.id === line.id
                                );

                                // remove line
                                newCurrentIssuesData[issueIndex][section.name] =
                                  newCurrentIssuesData[issueIndex][
                                    section.name
                                  ].filter((l) => l.id !== line.id);

                                // if the section is empty, add a new empty block
                                if (
                                  newCurrentIssuesData[issueIndex][section.name]
                                    .length === 0
                                ) {
                                  newCurrentIssuesData[issueIndex][
                                    section.name
                                  ].push(newLine);
                                }

                                return newCurrentIssuesData;
                              });
                            }
                          }}
                          onChange={(htmlEdits, rawEdits) => {
                            // before attempting a save, check if the line is identical to the previous line (both trimmed)
                            rawEdits = rawEdits.trim();
                            if (rawEdits === line.value.trim()) {
                              return;
                            }

                            // save rawEdits to the correct line
                            setCurrentIssuesData((prevCurrentIssuesData) => {
                              // get the current data and correct line that was changed
                              let newCurrentIssuesData = [
                                ...prevCurrentIssuesData
                              ];
                              let lineIndex = newCurrentIssuesData[issueIndex][
                                section.name
                              ].findIndex((l) => l.id === line.id);

                              // save html and raw edits
                              newCurrentIssuesData[issueIndex][section.name][
                                lineIndex
                              ].html = htmlEdits;
                              newCurrentIssuesData[issueIndex][section.name][
                                lineIndex
                              ].value = rawEdits;

                              return newCurrentIssuesData;
                            });
                          }}
                          onDragToIssue={undefined}
                        />
                      ))}
                  </div>
                </div>

                {section.name === 'assessment' && (
                  <div className="w-full">
                    {/* Practice Cards */}
                    <div className="mb-3">
                      <div className="mb-1 flex flex-row items-center">
                        <h1 className="text-sm font-semibold">
                          Tracked Self-Regulation Gaps
                        </h1>
                        <ul className="ml-2 flex flex-wrap text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                          <li
                            className={`me-2 inline-block rounded-lg px-2 py-0.5 ${showPracticeGaps === 'Hide Gaps' ? 'active bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                            onClick={() => {
                              setShowPracticeGaps('Hide Gaps');
                            }}
                          >
                            Hide Gaps
                          </li>
                          <li
                            className={`me-2 inline-block rounded-lg px-2 py-0.5 ${showPracticeGaps === 'Show Gaps' ? 'active bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                            onClick={() => {
                              setShowPracticeGaps('Show Gaps');
                            }}
                          >
                            Show Gaps
                          </li>
                          <li
                            className={`me-2 inline-block rounded-lg px-2 py-0.5 ${showPracticeGaps === 'Show Gaps with Details' ? 'active bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                            onClick={() => {
                              setShowPracticeGaps('Show Gaps with Details');
                            }}
                          >
                            Show Gaps with Details
                          </li>
                        </ul>
                      </div>

                      {/* Active Practices Gaps */}
                      <div className="flex flex-row flex-nowrap gap-2 overflow-auto">
                        {/* TODO: this is the same code as in the home page. abstract out */}
                        {practiceGapData
                          .filter((practiceGap) => {
                            return (
                              !practiceGap.practiceInactive &&
                              !practiceGap.practiceArchived
                            );
                          })
                          .map((practiceGap) => (
                            <PracticeGapCard
                              key={`issue-card-${practiceGap.id}`}
                              project={project}
                              sig={sig}
                              date={new Date(date).toISOString()}
                              practiceGapId={practiceGap.id}
                              practiceGap={practiceGap}
                              practiceGapsData={practiceGapData}
                              setPracticeGapsData={setPracticeGapData}
                              showPracticeGaps={showPracticeGaps}
                              setShowPracticeGaps={setShowPracticeGaps}
                              currentIssuesData={currentIssuesData}
                              setCurrentIssuesData={setCurrentIssuesData}
                              className={`flex-none ${showPracticeGaps === 'Show Gaps with Details' ? 'w-1/4' : 'w-1/6'}`}
                            />
                          ))}

                        {/* practice card for new practice gaps */}
                        <PracticeGapCard
                          key="issue-card-add-practice"
                          project={project}
                          sig={sig}
                          date={new Date(date).toISOString()}
                          practiceGapId="add-practice"
                          practiceGap={null}
                          practiceGapsData={practiceGapData}
                          setPracticeGapsData={setPracticeGapData}
                          showPracticeGaps={showPracticeGaps}
                          setShowPracticeGaps={setShowPracticeGaps}
                          currentIssuesData={currentIssuesData}
                          setCurrentIssuesData={setCurrentIssuesData}
                          className="w-1/6 flex-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Add helper text on how to use the plan section */}
                {section.name === 'plan' && (
                  <>
                    <div className="mt-2 flex flex-row text-xs italic text-gray-700">
                      {/* Kinds of practice agents */}
                      <div className="mr-2 basis-1/4 align-top">
                        <h2 className="font-bold">Issue follow-ups</h2>
                        <div>
                          <p>
                            <span className="font-semibold">[plan]:</span>{' '}
                            stories, deliverables, or tasks to add to sprint
                            log.
                          </p>
                          <p>
                            <span className="font-semibold">[help]:</span> work
                            with a peer or mentor on practice.
                          </p>
                        </div>
                      </div>

                      <div className="mr-6 basis-1/4 align-top">
                        <h2 className="font-bold">&nbsp;</h2>
                        <div>
                          <p>
                            <span className="font-semibold">[reflect]:</span>{' '}
                            reflect on a situation if it comes up.
                          </p>
                          <p>
                            <span className="font-semibold">[self-work]:</span>{' '}
                            work activity for student to do on their own.
                          </p>
                        </div>
                      </div>

                      {/* Additional info to attach */}
                      <div className="mr-2 basis-1/4 align-top">
                        <h2 className="font-bold">
                          Include additional info with...
                        </h2>
                        <div>
                          {/* what (practice), who, where / when, how */}
                          <p>
                            <span className="font-semibold">
                              w[<span className="font-normal">person</span>]:
                            </span>{' '}
                            start a DM with a person to do the practice.
                          </p>
                          <p>
                            <span className="font-semibold">
                              at[
                              <span className="font-normal">opportunity</span>
                              ]:
                            </span>{' '}
                            next opportunity to do practice at (e.g., mysore,
                            pair research).
                          </p>
                        </div>
                      </div>

                      <div className="basis-1/4 align-top">
                        <h2 className="font-bold">&nbsp;</h2>
                        <div>
                          {/* what (practice), who, where / when, how */}
                          <p>
                            <span className="font-semibold">
                              rep[
                              <span className="font-normal">
                                representation
                              </span>
                              ]:
                            </span>{' '}
                            representation to use for practice, which will be
                            included in strategy. Supports canvas, design, and
                            planning learning modules; general writing, table,
                            or diagram.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Prior Issue Instances */}
          {/* TODO: 04-30-24 -- fix once the drag and drop to connect past issues is working */}
          {/* TODO: 04-23-24 make this show only 1 */}
          {/* <div className="w-full mt-4">
            <h1 className="font-bold text-xl border-b border-black mb-2">
              Last Instance
            </h1>
            {priorInstances.length === 0 && (
              <h2 className="text-sm color-grey">
                There are no prior issues for this practice.
              </h2>
            )}

            {priorInstances.map((instance, i) => (
              <div
                className="w-full border border-gray-300 rounded-lg mb-3 p-1"
                key={i}
              >
                <h2 className="text-sm font-bold">{instance.date}</h2>

                <h3 className="text-sm font-bold mt-2">Context:</h3>
                <div className="text-sm">
                  {instance.context && instance.context.length > 0 ? (
                    <>
                      {instance.context.map((context) => (
                        <p key={context.id}>{context.value}</p>
                      ))}
                    </>
                  ) : (
                    <span className="italic">
                      No context was written for this instance.
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold mt-2">Assessment:</h3>
                <div className="text-sm">
                  {instance.assessment && instance.assessment.length > 0 ? (
                    <>
                      {instance.assessment.map((assessment) => (
                        <p key={assessment.id}>{assessment.value}</p>
                      ))}
                    </>
                  ) : (
                    <span className="italic">
                      No assessments were written for this instance.
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold mt-2">Practices:</h3>
                <div>
                  {instance.plan && instance.plan.length > 0 ? (
                    <>
                      {instance.plan.map((plan) => (
                        <p key={plan.id} className="text-sm">
                          {plan.value}
                        </p>
                      ))}
                    </>
                  ) : (
                    <p className="italic">
                      No follow-up practices for this instance.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div> */}
        </div>
      )}
    </div>
  );
}
