import { Switch } from '@headlessui/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import TextBox from './TextBox';
import { longDate } from '../lib/helperFns';

import NoteBlock from './NoteBlock';
import mongoose from 'mongoose';

export default function IssuePane({
  practiceId,
  capData,
  setCAPData,
  summarySections,
  autocompleteTriggersOptions
}): JSX.Element {
  // get the issue from soapData with the given practiceId
  const practiceIndex = capData.practices.findIndex(
    (practice) => practice.id === practiceId
  );
  const currIssue = capData.practices[practiceIndex];
  const currInstance = currIssue.currentInstance;
  const priorInstances = currIssue.priorInstances;

  return (
    <div className="mb-5">
      {/* Issue title */}
      <div className="flex flex-wrap mb-1 w-full">
        <h2 className="text-lg font-bold">Practice:</h2>
        <textarea
          value={currIssue.title}
          onChange={(e) => {
            let updatedPractices = capData.practices;
            updatedPractices[practiceIndex].title = e.target.value;
            updatedPractices[practiceIndex].lastUpdated = longDate(new Date());

            setCAPData((prevData) => ({
              ...prevData,
              practices: updatedPractices
            }));
          }}
          placeholder="Describe the issue..."
          className="w-full text-base mb-2 p-1 h-16"
        />

        <h2 className="text-lg font-bold">Description of practice:</h2>
        <textarea
          value={currIssue.description}
          onChange={(e) => {
            let updatedPractices = capData.practices;
            updatedPractices[practiceIndex].description = e.target.value;
            updatedPractices[practiceIndex].lastUpdated = longDate(new Date());

            setCAPData((prevData) => ({
              ...prevData,
              practices: updatedPractices
            }));
          }}
          placeholder="Describe the issue..."
          className="w-full text-base p-1 h-20"
        />

        {/* Current Issue Instance */}
        <div className="w-full mt-4">
          <div className="flex border-b border-black mb-2">
            <h1 className="inline-flex font-bold text-xl mr-2">
              Current Issue
            </h1>

            {/* Warning messages for incomplete follow-ups on current instance */}
            <div
              className={`inline-flex items-center text-md text-orange-500 ${currInstance !== null && currInstance.plan.length === 0 ? '' : 'opacity-0'}`}
            >
              <ExclamationTriangleIcon className="h-4" />
              <span className="mx-1 font-medium">Missing practice plan</span>
            </div>
          </div>

          {/* show if no current instance is there already */}
          {currInstance === null && (
            <div className="mt-2">
              <h2 className="text-sm color-grey">
                Add a new issue for the practice by clicking the button below.
              </h2>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold px-2 py-1 h-8 rounded-full mt-2"
                onClick={() => {
                  let updatedPractices = capData.practices;
                  updatedPractices[practiceIndex].currentInstance = {
                    date: new Date(),
                    context: [],
                    assessment: [],
                    plan: [],
                    followUps: []
                  };
                  updatedPractices[practiceIndex].lastUpdated = longDate(
                    new Date()
                  );

                  setCAPData((prevData) => ({
                    ...prevData,
                    practices: updatedPractices
                  }));
                }}
              >
                Add Issue
              </button>
            </div>
          )}

          {/* TODO: this is hella jank and a shit load of repeated code */}
          {/* show if there is a current instance */}
          {currInstance !== null &&
            summarySections.map((section) => (
              <div className={`w-full`} key={section.name}>
                <h1 className="font-bold text-lg">{section.title}</h1>
                {section.name === 'plan' && (
                  <p className="text-sm">
                    Add practices for CAP notes to follow-up on by typing,
                    &quot;[&quot; and selecting from the autocomplete options.
                    These will be sent to the students&apos; project channel
                    before the next practice opportunity, or after SIG for
                    self-practice.
                  </p>
                )}

                {/* TODO: abstract out the update code */}
                {/* <TextBox
                  value={currInstance[section.name]}
                  triggers={Object.keys(
                    autocompleteTriggersOptions[section.name]
                  )}
                  options={autocompleteTriggersOptions[section.name]}
                  onFocus={(e) => {
                    // add a "- " if the text box is empty
                    if (e.target.value === '') {
                      let updatedIssues = capData.practices;
                      updatedIssues[practiceIndex].currentInstance[
                        section.name
                      ] = '- ';
                      updatedIssues[practiceIndex].lastUpdated = longDate(
                        new Date()
                      );

                      setCAPData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    // remove the dash if the text box is empty
                    if (e.target.value.trim() === '-') {
                      let updatedIssues = capData.practices;
                      updatedIssues[practiceIndex].currentInstance[
                        section.name
                      ] = '';
                      updatedIssues[practiceIndex].lastUpdated = longDate(
                        new Date()
                      );

                      setCAPData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }
                  }}
                  onKeyUp={(e) => {
                    // add a new line to the text box with a dash when the user presses enter
                    if (e.key === 'Enter') {
                      // check if it's not a script line
                      let lines = e.target.value.split('\n');
                      if (
                        lines.length >= 1 &&
                        lines[lines.length - 1].match(
                          /\[(plan|help|reflect|self-work)]:/g
                        ) !== null
                      ) {
                        return;
                      }

                      let updatedIssues = capData.practices;
                      updatedIssues[practiceIndex].currentInstance[
                        section.name
                      ] = e.target.value + '- ';
                      updatedIssues[practiceIndex].lastUpdated = longDate(
                        new Date()
                      );

                      setCAPData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }
                  }}
                  onChange={(edits) => {
                    let updatedIssues = capData.practices;
                    updatedIssues[practiceIndex].currentInstance[section.name] =
                      edits;
                    updatedIssues[practiceIndex].lastUpdated = longDate(
                      new Date()
                    );

                    setCAPData((prevData) => ({
                      ...prevData,
                      issues: updatedIssues
                    }));
                  }}
                  onMouseUp={(e) => {
                    return;
                  }}
                  className="h-24 p-1"
                /> */}

                {/* Create section for each part of the CAP notes */}
                <div className="flex">
                  {/* Notetaking area */}
                  <div className="flex-auto">
                    {/* TODO: 04-23-24 -- current issues need to be initialized with an empty block and checked if there's an empty block before adding to it  */}
                    {currInstance[section.name].map((line) => (
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
                            setCAPData((prevCAPData) => {
                              let newCAPData = { ...prevCAPData };

                              // find that line that was edited in the current instance of the practice
                              let lineIndex = newCAPData.practices[
                                practiceIndex
                              ].currentInstance[section.name].findIndex(
                                (l) => l.id === line.id
                              );

                              // if new line to add is at the end of the list, only add if there's not already an empty line
                              if (
                                lineIndex ===
                                newCAPData.practices[practiceIndex]
                                  .currentInstance[section.name].length -
                                  1
                              ) {
                                if (
                                  newCAPData.practices[
                                    practiceIndex
                                  ].currentInstance[section.name][
                                    lineIndex
                                  ].value.trim() === ''
                                ) {
                                  return newCAPData;
                                }
                              } else if (
                                lineIndex + 1 <
                                newCAPData.practices[practiceIndex]
                                  .currentInstance[section.name].length
                              ) {
                                if (
                                  newCAPData.practices[
                                    practiceIndex
                                  ].currentInstance[section.name][
                                    lineIndex + 1
                                  ].value.trim() === ''
                                ) {
                                  return newCAPData;
                                }
                              }

                              // otherwise, add to the list
                              newCAPData.practices[
                                practiceIndex
                              ].currentInstance[section.name].splice(
                                lineIndex + 1,
                                0,
                                {
                                  id: new mongoose.Types.ObjectId().toString(),
                                  type: 'note',
                                  context: [],
                                  value: ''
                                }
                              );

                              return newCAPData;
                            });
                          }

                          // if shift tab is pressed, move to the previous line
                          if (e.key === 'Tab' && e.shiftKey) {
                            let lineIndex = capData.practices[
                              practiceIndex
                            ].currentInstance[section.name].findIndex(
                              (l) => l.id === line.id
                            );
                            if (lineIndex > 0) {
                              document
                                .getElementById(
                                  capData.practices[practiceIndex]
                                    .currentInstance[section.name][
                                    lineIndex - 1
                                  ].id
                                )
                                .focus();
                            }
                          }
                          // if tab is pressed, move to the next line
                          else if (e.key === 'Tab' && !e.shiftKey) {
                            let lineIndex = capData.practices[
                              practiceIndex
                            ].currentInstance[section.name].findIndex(
                              (l) => l.id === line.id
                            );
                            if (
                              lineIndex + 1 <
                              capData.practices[practiceIndex].currentInstance[
                                section.name
                              ].length
                            ) {
                              document
                                .getElementById(
                                  capData.practices[practiceIndex]
                                    .currentInstance[section.name][
                                    lineIndex + 1
                                  ].id
                                )
                                .focus();
                            }
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
                          setCAPData((prevCAPData) => {
                            // get the current data and correct line that was changed
                            let newCAPData = { ...prevCAPData };
                            let lineIndex = newCAPData.practices[
                              practiceIndex
                            ].currentInstance[section.name].findIndex(
                              (l) => l.id === line.id
                            );

                            newCAPData.practices[practiceIndex].currentInstance[
                              section.name
                            ][lineIndex].value = edits;

                            return newCAPData;
                          });
                        }}
                        onDragToIssue={(practiceId, noteSection, noteBlock) => {
                          return;
                        }}
                      />
                    ))}
                    <div className="italic text-slate-400">
                      Press Shift-Enter to add a new text block. Press Tab to
                      move to next block, and Shift-Tab to move to previous
                      block.
                    </div>
                  </div>
                </div>

                {section.name === 'plan' && (
                  <div className="text-sm text-gray-700 italic mt-2">
                    <h2 className="font-bold">Practice follow-ups</h2>
                    <div className="grid grid-cols-2 gap-y-1 w-2/3">
                      <p>
                        [plan]: stories, deliverables, or tasks to add to the
                        student&apos;s sprint
                      </p>
                      <p>[help]: work with a peer or mentor on practice</p>
                      <p>[reflect]: reflect on a situation if it comes up</p>
                      <p>
                        [self-work]: work activity for student to do on their
                        own
                      </p>
                    </div>

                    <h2 className="font-bold mt-4">
                      Include additional info using:
                    </h2>
                    <div className="grid grid-cols-2 gap-y-1 w-2/3">
                      {/* what (practice), who, where / when, how */}
                      <p>
                        w/[person]: who the practice should be done with (e.g.,
                        mentor, peer, self)
                      </p>
                      <p>
                        @[venue]: specific venue to do the practice; CAP will
                        follow-up at the next one.
                      </p>
                      <p>
                        rep/[representation]: representation to use for practice
                        (e.g., canvas section; sketch of a journey map;
                        reflection question(s))
                      </p>
                    </div>
                    <br></br>
                  </div>
                )}
              </div>
            ))}

          {/* Button to remove current instance */}
          {currInstance !== null && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white text-xs font-bold px-4 py-1 h-8 rounded-full mt-2 mb-2"
              onClick={() => {
                // confirm with user before removing
                if (
                  !confirm(
                    'Are you sure you want to remove the current issue instance?'
                  )
                ) {
                  return;
                }

                // remove the current instance
                let updatedIssues = capData.practices;
                updatedIssues[practiceIndex].currentInstance = null;
                updatedIssues[practiceIndex].lastUpdated = longDate(new Date());

                setCAPData((prevData) => ({
                  ...prevData,
                  issues: updatedIssues
                }));
              }}
            >
              Remove current issue
            </button>
          )}
        </div>

        {/* Prior Issue Instances */}
        <div className="w-full mt-4">
          <h1 className="font-bold text-xl border-b border-black mb-2">
            Last Instance
          </h1>
          {priorInstances.length === 0 && (
            <h2 className="text-sm color-grey">
              There are no prior issues for this practice.
            </h2>
          )}
          {/* TODO 04-23-24: make this show only 1 */}
          {priorInstances.map((instance, i) => (
            <div
              className="w-full border border-gray-300 rounded-lg mb-3 p-1"
              key={i}
            >
              <h2 className="text-sm font-bold">{instance.date}</h2>
              <h3 className="text-sm font-bold mt-2">Summary:</h3>
              <p className="text-sm">{instance.summary}</p>
              <h3 className="text-sm font-bold mt-2">Practices:</h3>
              <p className="text-sm">
                {instance.plan && instance.plan.length ? (
                  <>{instance.plan}</>
                ) : (
                  <span className="italic">
                    No follow-up practices for this issue instance.
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
