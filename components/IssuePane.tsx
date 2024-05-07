import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { longDate } from '../lib/helperFns';

import NoteBlock from './NoteBlock';
import mongoose from 'mongoose';

export default function IssuePane({
  issueId,
  capData,
  setCAPData,
  capSections,
  autocompleteTriggersOptions
}): JSX.Element {
  // get the issue from soapData with the given issueId
  const issueIndex = capData.currentIssues.findIndex(
    (practice) => practice.id === issueId
  );
  const currIssue = capData.currentIssues[issueIndex];
  let priorInstances = [];
  if (currIssue && currIssue.priorInstances) {
    priorInstances = currIssue.priorInstances;
  }

  return (
    <div className="mb-5">
      {currIssue && (
        <div className="flex flex-wrap w-full overflow-y-scroll overscroll-y-auto">
          <div className="w-full">
            {/* TODO: this is hella jank and a shit load of repeated code */}
            {/* show if there is a current instance */}
            {capSections.map((section) => (
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

                {/* Create section for each part of the CAP notes */}
                <div className="flex">
                  {/* Notetaking area */}
                  <div className="flex-auto">
                    {/* TODO: 04-23-24 -- current issues need to be initialized with an empty block and checked if there's an empty block before adding to it  */}
                    {currIssue[section.name].map((line) => (
                      <NoteBlock
                        key={line.id}
                        noteSection={section.name}
                        noteId={line.id}
                        noteContent={line}
                        onKeyDown={(e) => {
                          // stop default behavior of enter key if both enter and shift are pressed
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

                          // check for shift-enter to add a new line
                          if (e.key === 'Enter' && e.shiftKey) {
                            // add new line underneath the current line
                            setCAPData((prevCAPData) => {
                              let newCAPData = { ...prevCAPData };

                              // find that line that was edited in the current instance of the practice
                              let lineIndex = newCAPData.currentIssues[
                                issueIndex
                              ][section.name].findIndex(
                                (l) => l.id === line.id
                              );

                              // check if the current line is empty
                              if (
                                lineIndex ===
                                newCAPData.currentIssues[issueIndex][
                                  section.name
                                ].length -
                                  1
                              ) {
                                // don't add a new line if the current line is empty
                                if (
                                  newCAPData.currentIssues[issueIndex][
                                    section.name
                                  ][lineIndex].value.trim() === ''
                                ) {
                                  newLineId =
                                    newCAPData.currentIssues[issueIndex][
                                      section.name
                                    ][lineIndex].id;
                                  return newCAPData;
                                }
                              } else if (
                                lineIndex + 1 <
                                newCAPData.currentIssues[issueIndex][
                                  section.name
                                ].length
                              ) {
                                // don't add a new line if the next line is already an empty block
                                if (
                                  newCAPData.currentIssues[issueIndex][
                                    section.name
                                  ][lineIndex + 1].value.trim() === ''
                                ) {
                                  newLineId =
                                    newCAPData.currentIssues[issueIndex][
                                      section.name
                                    ][lineIndex + 1].id;
                                  return newCAPData;
                                }
                              }

                              // otherwise, add to the list
                              newLineId =
                                new mongoose.Types.ObjectId().toString();
                              newCAPData.currentIssues[issueIndex][
                                section.name
                              ].splice(lineIndex + 1, 0, {
                                id: newLineId,
                                type: 'note',
                                context: [],
                                value: ''
                              });

                              return newCAPData;
                            });

                            // TODO: 04-23-24 this causes a race condition where the new line is not yet rendered
                            // could be fixed with a callback: https://github.com/the-road-to-learn-react/use-state-with-callback#usage
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
                            setCAPData((prevCAPData) => {
                              let newCAPData = { ...prevCAPData };

                              // find that line that was edited in the current instance of the practice
                              let lineIndex = newCAPData.currentIssues[
                                issueIndex
                              ][section.name].findIndex(
                                (l) => l.id === line.id
                              );

                              // remove line
                              newCAPData.currentIssues[issueIndex][
                                section.name
                              ] = newCAPData.currentIssues[issueIndex][
                                section.name
                              ].filter((l) => l.id !== line.id);

                              // if the section is empty, add a new empty block
                              if (
                                newCAPData.currentIssues[issueIndex][
                                  section.name
                                ].length === 0
                              ) {
                                newCAPData.currentIssues[issueIndex][
                                  section.name
                                ].push({
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
                            let lineIndex = newCAPData.currentIssues[
                              issueIndex
                            ][section.name].findIndex((l) => l.id === line.id);

                            newCAPData.currentIssues[issueIndex][section.name][
                              lineIndex
                            ].value = edits;

                            return newCAPData;
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
                              date: longDate(new Date()),
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
                            let issueIndex = capData.currentIssues.findIndex(
                              (practice) => practice.id === targetissueId
                            );
                            let issueInstance =
                              capData.currentIssues[issueIndex];

                            // create a new issue instance for the practice if it doesn't exist
                            if (issueInstance === null) {
                              // if the current instance doesn't exist, intialize it with the additions from the notetaking space
                              issueInstance = {
                                id: new mongoose.Types.ObjectId().toString(),
                                date: longDate(new Date(new Date())),
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
                                issueInstance.context = editsToIssue['context'];
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
                                issueInstance.plan = issueInstance.plan.concat(
                                  editsToIssue['plan']
                                );
                              }

                              // update the last updated date
                              issueInstance.date = longDate(new Date());
                            }

                            setCAPData((prevCAPData) => {
                              let newCAPData = { ...prevCAPData };
                              newCAPData.currentIssues[issueIndex] =
                                issueInstance;
                              newCAPData.currentIssues[issueIndex].lastUpdated =
                                longDate(new Date());

                              return newCAPData;
                            });

                            targetissueId =
                              capData.currentIssues[issueIndex].id;
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
                            newSoapData.currentIssues[issueIndex][noteSection] =
                              newSoapData.currentIssues[issueIndex][
                                noteSection
                              ].filter((line) => line.id !== noteBlock.id);

                            // if the section is empty, add a new empty block
                            if (
                              newSoapData.currentIssues[issueIndex][noteSection]
                                .length === 0
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
                  </div>
                </div>

                {section.name === 'plan' && (
                  <>
                    <div className="italic text-slate-400">
                      Press Shift-Enter to add a new text block and
                      Shift-Backspace to delete current block. Press Tab to move
                      to next block, and Shift-Tab to move to previous block.
                    </div>
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
                          w/[person, person]: person(s) who the practice should
                          be done with
                        </p>
                        <p>
                          @[venue]: specific venue to do the practice; CAP will
                          follow-up at the next one.
                        </p>
                        <p>
                          rep/[representation]: representation to use for
                          practice (e.g., canvas section; sketch of a journey
                          map; reflection question(s))
                        </p>
                      </div>
                      <br></br>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Prior Issue Instances */}
          {/* TODO: 04-30-24 -- fix once the drag and drop to connect past issues is working */}
          <div className="w-full mt-4">
            <h1 className="font-bold text-xl border-b border-black mb-2">
              Last Instance
            </h1>
            {priorInstances.length === 0 && (
              <h2 className="text-sm color-grey">
                There are no prior issues for this practice.
              </h2>
            )}
            {/* TODO: 04-23-24 make this show only 1 */}
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
          </div>
        </div>
      )}
    </div>
  );
}
