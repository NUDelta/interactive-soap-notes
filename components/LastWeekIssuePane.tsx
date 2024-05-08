import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { longDate } from '../lib/helperFns';

import NoteBlock from './NoteBlock';
import mongoose from 'mongoose';
import PracticeGapCard from './PracticeGapCard';
import { useEffect, useState } from 'react';

export default function LastWeekIssuePane({
  issueId,
  capData,
  setCAPData,
  capSections
}): JSX.Element {
  // get the cap context section
  let section = capSections.find((section) => section.name === 'context');

  // get the issue from soapData with the given issueId
  const issueIndex = capData.pastIssues.findIndex(
    (issue) => issue.id === issueId
  );
  const selectedLastWeekIssue = capData.pastIssues[issueIndex];
  let priorInstances = [];
  if (selectedLastWeekIssue && selectedLastWeekIssue.priorInstances) {
    priorInstances = selectedLastWeekIssue.priorInstances;
  }

  // check if there are any assessments
  let nonEmptyAssessmentLength =
    selectedLastWeekIssue !== undefined
      ? selectedLastWeekIssue['assessment'].filter(
          (line) => line.value.trim() !== ''
        ).length
      : 0;

  let relevantPractices = capData.trackedPractices.filter((practice) => {
    return (
      !practice.practiceInactive &&
      !practice.practiceArchived &&
      selectedLastWeekIssue['assessment'].some((assessment) => {
        return assessment.value
          .trim()
          .toLowerCase()
          .replace(/&nbsp;/g, '')
          .replace(/&amp;/g, '&')
          .includes(
            practice.title
              .trim()
              .toLowerCase()
              .replace(/&nbsp;/g, '')
              .replace(/&amp;/g, '&')
          );
      })
    );
  });

  // compute and store practice outcome for the last
  const [practiceOutcome, setPracticeOutcome] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const createYellkeyForURL = async (url) => {
      let shorteredUrl = null;
      try {
        shorteredUrl = await fetch(
          'https://www.yellkey.com/api/new?' +
            new URLSearchParams({ url: url, time: '60' })
        );
        let res = await shorteredUrl.json();
        shorteredUrl = res.key;
      } catch (error) {
        console.error('Error in creating yellkey for URL', error);
      }
      return shorteredUrl;
    };

    const getYellKeysForAllDeliverables = async (practiceOutcome) => {
      setIsLoading(true);

      // check if practiceOutcome is null before proceeding
      if (practiceOutcome === null) {
        setIsLoading(false);
        setPracticeOutcome(practiceOutcome);
        return;
      }

      /// create a yellkey for each deliverable
      let updatedPracticeOutcome = [];
      for (let i = 0; i < practiceOutcome.length; i++) {
        let practice = practiceOutcome[i];
        let updatedDeliverable = practice.deliverable;
        if (updatedDeliverable !== null) {
          let yellkey = await createYellkeyForURL(updatedDeliverable);
          updatedPracticeOutcome.push({
            ...practice,
            yellkey
          });
        } else {
          updatedPracticeOutcome.push({
            ...practice,
            yellkey: null
          });
        }
      }
      setIsLoading(false);

      // set state variable
      setPracticeOutcome(updatedPracticeOutcome);
    };

    // get the last prior instance, if provided
    // prior instances are ordered by date, so the first one is the most recent
    let practiceOutcome = selectedLastWeekIssue.followUps
      .filter((followup) => {
        return !followup.practice.includes('[plan]');
      })
      .map((followUp) => {
        return {
          practice: followUp.practice,
          didHappen: followUp.outcome.didHappen,
          deliverable: followUp.practice.includes('[reflect]')
            ? null
            : followUp.outcome.deliverableLink,
          reflections: followUp.outcome.reflections
            .filter((reflection) => {
              return (
                !reflection.prompt.includes(
                  'Share a link to any deliverable'
                ) && !reflection.prompt.includes('Did you do the')
              );
            })
            .map((reflection) => {
              return {
                prompt: reflection.prompt,
                response: reflection.response
              };
            })
        };
      });

    getYellKeysForAllDeliverables(practiceOutcome);
  }, [selectedLastWeekIssue.followUps]);

  return (
    <div className="mb-5">
      {selectedLastWeekIssue && (
        <>
          <div className="flex flex-wrap w-full overflow-y-scroll overscroll-y-auto">
            {/* Split Pane in half with assesments on 1/3 */}
            <div className="w-full flex flex-row">
              <div className="w-1/3 flex flex-col mr-6">
                <h1 className="font-bold text-lg">Assessments for Issue</h1>
                {/* Assessments on Last Week's Issues */}
                <div className="mb-2">
                  {selectedLastWeekIssue['assessment'] &&
                    selectedLastWeekIssue['assessment'].map((line) => (
                      <>
                        {line.value.trim() !== '' && (
                          <NoteBlock
                            key={line.id}
                            noteSection={'assessment'}
                            noteId={line.id}
                            noteContent={line}
                            editable={false}
                            onKeyDown={() => {
                              return;
                            }}
                            onKeyUp={() => {
                              return;
                            }}
                            onChange={() => {
                              return;
                            }}
                            onDragToIssue={() => {
                              return;
                            }}
                          />
                        )}
                      </>
                    ))}
                  {nonEmptyAssessmentLength == 0 && (
                    <div className="italic">
                      No assessments written for issue
                    </div>
                  )}
                </div>
              </div>

              {/* Show practice gaps linked to issue */}
              <div className="w-full">
                <div>
                  <h1 className="font-bold text-lg">Practice Gaps for Issue</h1>
                </div>

                <div className="flex flex-row gap-2 flex-nowrap overflow-auto">
                  {relevantPractices.length !== 0 && (
                    <>
                      {/* TODO: 05-07-24: show the details of the practice gap */}
                      {relevantPractices.map((practice) => (
                        <PracticeGapCard
                          key={`issue-card-${practice.id}`}
                          issueId={practice.id}
                          title={practice.title}
                          description={practice.description}
                          lastUpdated={practice.lastUpdated}
                          priorInstances={practice.prevIssues}
                          issueIsResolved={false}
                          showPracticeGaps={false}
                          onResolved={(e) => {
                            return;
                          }}
                          onArchive={(e) => {
                            return;
                          }}
                          onEdit={(e) => {
                            return;
                          }}
                          onDrag={(e) => {
                            return;
                          }}
                        />
                      ))}
                    </>
                  )}
                  {relevantPractices.length === 0 && (
                    <div className="italic">
                      No practice gaps linked to this issue.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up objects on the remaining */}
            <div className="w-full">
              <h1 className="font-bold text-lg">Follow-Up Outcomes</h1>
              {/* Show practice follow-ups */}
              {!isLoading &&
              practiceOutcome !== null &&
              practiceOutcome.length > 0 ? (
                <div className="flex flex-row gap-2">
                  {practiceOutcome.map((practice) => {
                    return (
                      <div
                        key={practice.practice}
                        className="w-full mb-4 p-2 border"
                      >
                        <h2 className="text-sm font-semibold border-b border-black ">
                          {practice.practice}
                        </h2>

                        {/* { Did the practice happen? } */}
                        <div className="flex flex-wrap">
                          <div className="w-full">
                            <p className="text-sm font-semibold">
                              Did this happen?{' '}
                              <span
                                className={`font-normal ${practice.didHappen ? 'text-green-600' : 'text-rose-600'}`}
                              >
                                {practice.didHappen ? 'Yes' : 'No'}
                              </span>
                            </p>
                          </div>

                          {/* { Link to deliverable } */}
                          {practice.deliverable !== null ? (
                            <div className="w-full mt-1">
                              <p className="text-sm font-semibold">
                                {practice.deliverable !== '' ? (
                                  <>
                                    <a
                                      href={practice.deliverable}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-blue-600 underline font-normal"
                                    >
                                      Link to deliverable
                                    </a>
                                    {practice.yellkey == null ? (
                                      <></>
                                    ) : (
                                      <span className="font-semibold">
                                        {' '}
                                        {`(yellkey: `}
                                        <span className="text-indigo-600">
                                          {practice.yellkey}
                                        </span>
                                        {`)`}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="font-normal text-rose-600">
                                    Deliverable not linked
                                  </span>
                                )}
                              </p>
                            </div>
                          ) : (
                            <></>
                          )}

                          {/* { Reflections } */}
                          {practice.reflections.length > 0 ? (
                            <div className="w-full mt-1">
                              <h3 className="text-sm font-bold">
                                Reflections:
                              </h3>
                              {practice.reflections.map((reflection) => {
                                return (
                                  <div
                                    key={reflection.prompt}
                                    className="w-full mb-2"
                                  >
                                    <h4 className="text-sm font-medium">
                                      {reflection.prompt}
                                    </h4>
                                    {reflection.response === '' ? (
                                      <p className="text-sm text-rose-600">
                                        No response from student
                                      </p>
                                    ) : (
                                      <p className="text-sm text-green-600">
                                        {reflection.response}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <></>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="italic">No follow-up outcomes to show.</div>
              )}
            </div>

            {/* Context notetaking space */}
            <div className="w-full mt-4">
              <h1 className="font-bold text-xl">{section.title}</h1>
              <p className="text-sm italic">
                Note anything from the issue follow-ups above. Notes taken here
                will be stored in the Scratch Space.
              </p>

              <div className="flex">
                <div className="flex-auto">
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
                            let lineIndex = newCAPData[section.name].findIndex(
                              (l) => l.id === line.id
                            );

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
                                  newCAPData[section.name][lineIndex].id;
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
                                  newCAPData[section.name][lineIndex + 1].id;
                                return newCAPData;
                              }
                            }

                            // otherwise, add to the list
                            newLineId =
                              new mongoose.Types.ObjectId().toString();
                            newCAPData[section.name].splice(lineIndex + 1, 0, {
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
                            let lineIndex = newCAPData[section.name].findIndex(
                              (l) => l.id === line.id
                            );

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
                          let lineIndex = newCAPData[section.name].findIndex(
                            (l) => l.id === line.id
                          );

                          newCAPData[section.name][lineIndex].value = edits;

                          return newCAPData;
                        });
                      }}
                      onDragToIssue={(issueId, noteSection, noteBlock) => {
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
                          let issueIndex = capData.currentIssues.findIndex(
                            (practice) => practice.id === issueId
                          );
                          let issueInstance = capData.currentIssues[issueIndex];

                          // create a new issue instance for the issue if it doesn't exist
                          if (issueInstance === null) {
                            // if the current instance doesn't exist, intialize it with the additions from the notetaking space
                            issueInstance = {
                              id: new mongoose.Types.ObjectId().toString(),
                              date: longDate(new Date(noteInfo.sigDate)),
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
                            issueInstance.lastUpdated = longDate(new Date());
                          }

                          // update state variable
                          setCAPData((prevCAPData) => {
                            let newCAPData = { ...prevCAPData };
                            newCAPData.currentIssues[issueIndex] =
                              issueInstance;
                            newCAPData.currentIssues[issueIndex].lastUpdated =
                              longDate(new Date());

                            return newCAPData;
                          });

                          issueId = capData.currentIssues[issueIndex].id;
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
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
