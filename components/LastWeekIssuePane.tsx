import { htmlToText, longDate, shortDate } from '../lib/helperFns';
import NoteBlock from './NoteBlock';
import PracticeGapCard from './PracticeGapCard';
import { useEffect, useState } from 'react';
import LinkIcon from '@heroicons/react/24/outline/LinkIcon';
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';
import ExclamationCircleIcon from '@heroicons/react/24/outline/ExclamationCircleIcon';

export default function LastWeekIssuePane({
  issueId,
  noteInfo,
  currentIssuesData,
  setCurrentIssuesData,
  pastIssuesData,
  setPastIssuesData,
  practiceGapData,
  setPracticeGapData
}): JSX.Element {
  // state variable for showing practice gaps
  const [showPracticeGaps, setShowPracticeGaps] = useState('Show Gaps');

  // get the issue from soapData with the given issueId
  const issueIndex = pastIssuesData.findIndex((issue) => issue.id === issueId);
  const selectedLastWeekIssue = pastIssuesData[issueIndex];
  let priorInstances = [];
  if (selectedLastWeekIssue && selectedLastWeekIssue.priorInstances) {
    priorInstances = selectedLastWeekIssue.priorInstances;
  }

  // get the practice gaps linked to the issue by checking each practice gap's prevIssues to see if issueId is in it
  let relevantPracticeGaps = practiceGapData.filter((practiceGap) => {
    return practiceGap.prevIssues.some((prevIssue) => prevIssue.id === issueId);
  });

  // check if there are any assessments
  let nonEmptyAssessmentLength =
    selectedLastWeekIssue !== undefined
      ? selectedLastWeekIssue['assessment'].filter(
          (line) => line.value.trim() !== ''
        ).length
      : 0;

  // check if there are any context notes
  let nonEmptyContextLength =
    selectedLastWeekIssue !== undefined
      ? selectedLastWeekIssue['context'].filter(
          (line) => line.value.trim() !== ''
        ).length
      : 0;

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

    const getOrgObjects = async (practiceOutcome, projectName) => {
      let sprintData = null;
      try {
        const sprintDataRes = await fetch('/api/studio-api', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            projectName: projectName,
            noteDate: selectedLastWeekIssue.date
          })
        });

        // if the status is not 200, throw an error
        if (sprintDataRes.status !== 200) {
          throw new Error('Error in fetching sprint data');
        }

        sprintData = (await sprintDataRes.json()).data;
      } catch (error) {
        console.error('Error in fetching org objects', error);
      }

      // attach org objects to each practice outcome
      let newPracticeOutcome = {
        practices: practiceOutcome,
        projectData: sprintData === null ? null : sprintData.projectData,
        sprintData: sprintData === null ? null : sprintData.processData,
        currentSprint: null
      };

      // get the current sprint if sprintData and projectData are not null
      if (
        newPracticeOutcome.sprintData !== null &&
        newPracticeOutcome.projectData !== null
      ) {
        let currentSprint =
          newPracticeOutcome.projectData.sprint_log.sprints.find(
            (sprint) => sprint.name === newPracticeOutcome.sprintData.name
          );
        newPracticeOutcome.currentSprint = currentSprint;
        newPracticeOutcome.currentSprint.lastUpdated =
          newPracticeOutcome.projectData.sprint_log.lastUpdated;
      }

      setPracticeOutcome(newPracticeOutcome);
    };

    // TODO: this should all be in the parsed practice model so it doesn't have to be computed
    // get practice type
    const getPracticeType = (practice) => {
      if (practice.includes('[reflect]')) {
        return {
          practice: practice.replace('[reflect]', ''),
          introText: 'Reflect on your own:',
          type: 'Reflect After Sprint'
        };
      } else if (practice.includes('[plan]')) {
        return {
          practice: practice.replace('[plan]', ''),
          introText: 'Update your :',
          type: 'plan'
        };
      } else if (practice.includes('[self-work]')) {
        return {
          practice: practice.replace('[self-work]', ''),
          introText: 'On your own, try to:',
          type: 'Self-Work'
        };
      } else if (practice.includes('[help]')) {
        if (practice.includes('mysore')) {
          return {
            practice: practice.replace('[help]', ''),
            introText: 'At Mysore:',
            type: 'At Mysore'
          };
        } else if (practice.includes('pair research')) {
          return {
            practice: practice.replace('[help]', ''),
            introText: 'At Pair Research:',
            type: 'At Pair Research'
          };
        }

        // TODO: handle multiple people

        return {
          practice: practice.replace('[help]', ''),
          introText: 'Get help on:',
          type: 'Help'
        };
      }

      return null;
    };

    // get the last prior instance, if provided
    // prior instances are ordered by date, so the first one is the most recent
    let practiceOutcome = selectedLastWeekIssue.followUps
      .map((followUp) => {
        // if didHappen is null, don't have any relevantReflections
        // if didHappen is false, show the first set of reflections; else, show the second set
        let didHappen = followUp.outcome.didHappen;
        let relevantReflections;
        let filteredReflections;
        if (didHappen === null) {
          relevantReflections = null;
          filteredReflections = null;
        } else {
          if (didHappen) {
            relevantReflections = followUp.outcome.reflections[1];
          } else if (!didHappen) {
            relevantReflections = followUp.outcome.reflections[0];
          }
          filteredReflections = relevantReflections
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
            });
        }

        // practice type info
        let parsedPractice = getPracticeType(followUp.practice);
        if (parsedPractice === null) {
          console.error('Invalid practice type', followUp.practice);
          return null;
        }

        return {
          practice: htmlToText(parsedPractice.practice).trim(),
          introText: parsedPractice.introText.trim(),
          type: parsedPractice.type,
          didHappen: followUp.outcome.didHappen,
          deliverable: followUp.practice.includes('[reflect]')
            ? null
            : followUp.outcome.deliverableLink,
          deliverableNotes: followUp.outcome.deliverableNotes,
          reflections: filteredReflections
        };
      })
      .filter((followup) => followup !== null);

    // getYellKeysForAllDeliverables(practiceOutcome);
    getOrgObjects(practiceOutcome, noteInfo.project);
  }, [selectedLastWeekIssue, noteInfo]);

  return (
    <div className="mb-5">
      {selectedLastWeekIssue && (
        <>
          <div className="flex w-full flex-wrap">
            {/* Split Pane in half with assesments on 1/3 */}
            <div className="flex w-full flex-row">
              <div className="mr-6 flex w-1/3 flex-col">
                <div className="mb-1 text-xs italic">
                  Below are your notes from the last SIG meeting.
                </div>
                <h1 className="text-base font-bold">Context for Issue</h1>
                {/* Context notes on Last Week's Issues */}
                <div className="mb-2">
                  {selectedLastWeekIssue['context'] &&
                    selectedLastWeekIssue['context'].map((line) => (
                      <>
                        {line.value.trim() !== '' && (
                          <NoteBlock
                            key={`note-block-from-lastweekpane-${line.id}`}
                            noteSection={'context'}
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
                  {nonEmptyContextLength == 0 && (
                    <div className="text-xs italic">
                      No context notes written for issue.
                    </div>
                  )}
                </div>
                <h1 className="text-base font-bold">Assessments for Issue</h1>
                {/* Assessments on Last Week's Issues */}
                <div className="mb-2">
                  {selectedLastWeekIssue['assessment'] &&
                    selectedLastWeekIssue['assessment'].map((line) => (
                      <>
                        {line.value.trim() !== '' && (
                          <NoteBlock
                            key={`note-block-from-lastweekpane-${line.id}`}
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
                    <div className="text-xs italic">
                      No assessments written for issue.
                    </div>
                  )}
                </div>
              </div>

              {/* Show practice gaps linked to issue */}
              <div className="w-2/3">
                <div className="flex flex-row items-center">
                  <h1 className="text-base font-bold">
                    Self-Regulation Gaps for Issue
                  </h1>
                  {/* Toggle for details */}
                  {relevantPracticeGaps !== null &&
                    relevantPracticeGaps.length !== 0 && (
                      <ul className="ml-2 flex flex-wrap text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                        <li
                          className={`me-2 inline-block rounded-lg px-2 py-1 ${showPracticeGaps === 'Hide Gaps' ? 'active bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                          onClick={() => {
                            setShowPracticeGaps('Hide Gaps');
                          }}
                        >
                          Hide Gaps
                        </li>
                        <li
                          className={`me-2 inline-block rounded-lg px-2 py-1 ${showPracticeGaps === 'Show Gaps' ? 'active bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                          onClick={() => {
                            setShowPracticeGaps('Show Gaps');
                          }}
                        >
                          Show Gaps
                        </li>
                        <li
                          className={`me-2 inline-block rounded-lg px-2 py-1 ${showPracticeGaps === 'Show Gaps with Details' ? 'active bg-blue-600 text-white' : 'hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-white'}`}
                          onClick={() => {
                            setShowPracticeGaps('Show Gaps with Details');
                          }}
                        >
                          Show Gaps with Details
                        </li>
                      </ul>
                    )}
                </div>

                {/* Self-Regulation Gaps for Issue */}
                <div className="flex flex-row flex-nowrap gap-2 overflow-auto">
                  {/* Show gaps if they are there and not hidden */}
                  {relevantPracticeGaps.length > 0 &&
                    showPracticeGaps !== 'Hide Gaps' && (
                      <>
                        {relevantPracticeGaps.map((practiceGap) => (
                          <PracticeGapCard
                            key={`issue-card-${practiceGap.id}`}
                            project={noteInfo.project}
                            sig={noteInfo.sigName}
                            date={new Date(noteInfo.sigDate).toISOString()}
                            practiceGapId={practiceGap.id}
                            practiceGap={practiceGap}
                            practiceGapsData={practiceGapData}
                            setPracticeGapsData={setPracticeGapData}
                            currentIssuesData={currentIssuesData}
                            setCurrentIssuesData={setCurrentIssuesData}
                            showPracticeGaps={showPracticeGaps}
                            setShowPracticeGaps={setShowPracticeGaps}
                            className="flex-none basis-1/3"
                          />
                        ))}
                      </>
                    )}

                  {/* Show gaps if gaps there, but hidden */}
                  {relevantPracticeGaps.length > 0 &&
                    showPracticeGaps === 'Hide Gaps' && (
                      <div className="text-xs italic">
                        Click above to show self-regulation gaps.
                      </div>
                    )}

                  {/* No gaps to show */}
                  {relevantPracticeGaps.length === 0 && (
                    <div className="text-xs italic">
                      No self-regulation gaps linked to this issue.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up objects on the remaining */}
            <div className="w-full">
              <div className="mb-1">
                <h1 className="text-base font-bold">Follow-Up Outcomes</h1>
                <h2 className="text-sm italic">
                  Text in{' '}
                  <span className="font-semibold text-green-600">green</span>{' '}
                  are responses from the students(s). Text in{' '}
                  <span className="font-semibold text-rose-600">red</span>{' '}
                  indicates missing reflections or documents.
                </h2>
              </div>
              {/* Show practice follow-ups */}
              {!isLoading &&
              practiceOutcome !== null &&
              practiceOutcome.practices !== null &&
              practiceOutcome.practices.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {/* show plan follow-ups as a single card */}
                  {practiceOutcome.practices.filter((practice) => {
                    return practice.type === 'plan';
                  }).length > 0 && (
                    <div
                      key="plan-follow-up"
                      className="w-full border p-2 shadow"
                    >
                      {/* Plan Updating Practices */}
                      <div className="mb-4">
                        <div className="flex flex-col border-b border-black text-xs font-normal">
                          <div className="mb-auto mr-2 text-sm font-semibold">
                            Suggested Plan Updates
                          </div>
                          <div className="flex flex-row items-center">
                            <LinkIcon className="mr-0.5 h-3 stroke-2 text-blue-600" />
                            <a
                              href={practiceOutcome.currentSprint.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mr-1 text-blue-600 underline"
                            >
                              Sprint Log
                            </a>
                            <span className="italic">
                              (Last Updated:{' '}
                              {longDate(
                                new Date(
                                  practiceOutcome.currentSprint.lastUpdated
                                )
                              )}
                              )
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap">
                          {practiceOutcome.practices
                            .filter((practice) => {
                              return practice.type === 'plan';
                            })
                            .reduce((acc, practice) => {
                              return [...acc, practice.practice];
                            }, [])
                            .map((practice) => {
                              return (
                                <div key={practice} className="w-full">
                                  <p className="font-base text-xs">
                                    - {practice}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* Stories and Deliverables */}
                      <div className="mb-2 flex w-full flex-col">
                        <div className="grid w-full grid-cols-2 border-b border-black text-sm">
                          <div>Updated Sprint Stories</div>
                          <div>Updated Sprint Deliverables</div>
                        </div>
                        {practiceOutcome.currentSprint !== null && (
                          <>
                            {practiceOutcome.currentSprint.stories.map(
                              (story, index) => {
                                return (
                                  <div
                                    key={`sprint-story-${index}`}
                                    className="mb-2 grid w-full grid-cols-2 text-xs leading-snug"
                                  >
                                    <div>{story.description}</div>
                                    <div
                                      className={`${story.deliverables === null && 'text-rose-600'}`}
                                    >
                                      {story.deliverables === null
                                        ? 'No deliverable'
                                        : story.deliverables}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </>
                        )}
                      </div>

                      {/* Points */}
                      <div className="flex w-full flex-col">
                        <div className="grid w-full grid-cols-3 border-b border-black text-sm">
                          <div>Student</div>
                          <div>Points Committed</div>
                          <div>Hours Spent</div>
                        </div>
                        {practiceOutcome.currentSprint !== null && (
                          <>
                            {practiceOutcome.currentSprint.points
                              .filter((pointInfo) => {
                                return pointInfo.name.trim() !== '';
                              })
                              .map((student, index) => {
                                return (
                                  <div
                                    key={`sprint-points-${index}`}
                                    className="mb-2 grid w-full grid-cols-3 text-xs leading-snug"
                                  >
                                    <div>{student.name}</div>
                                    <div>
                                      {Math.round(
                                        student.pointsCommitted.total * 2
                                      ) / 2}
                                    </div>
                                    <div>
                                      {Math.round(
                                        student.hoursSpent.total * 2
                                      ) / 2}
                                    </div>
                                    {/* <div
                                      className={`${student.deliverables === null && 'text-rose-600'}`}
                                    >
                                      {student.deliverables === null
                                        ? 'No deliverable'
                                        : student.deliverables}
                                    </div> */}
                                  </div>
                                );
                              })}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* show non plan follow-ups */}
                  {practiceOutcome.practices
                    .filter((practice) => {
                      return practice.type !== 'plan';
                    })
                    .map((practice) => {
                      return (
                        <div
                          key={practice.practice}
                          className="w-full border p-2 shadow"
                        >
                          <h2 className="border-b border-black text-xs ">
                            <span className="font-semibold">
                              {practice.type}:
                            </span>{' '}
                            {practice.practice}
                          </h2>

                          {/* { Did the practice happen? } */}
                          <div className="flex flex-wrap">
                            <div className="flex w-full flex-row items-center text-xs font-normal">
                              {/* If didHappen is null, then we have no response from the student; if it's true / false, then show whether student tried to do the practice */}
                              {practice.didHappen === null ? (
                                <ExclamationCircleIcon className="mr-1 h-4 stroke-2 text-rose-600" />
                              ) : practice.didHappen ? (
                                <CheckBadgeIcon className="mr-1 h-4 stroke-2 text-green-600" />
                              ) : (
                                <ExclamationCircleIcon className="mr-1 h-4 stroke-2 text-rose-600" />
                              )}

                              <span
                                className={`font-normal ${practice.didHappen === null ? 'text-rose-600' : practice.didHappen ? 'text-green-600' : 'text-rose-600'}`}
                              >
                                {practice.didHappen == null
                                  ? 'No response from student(s)'
                                  : practice.didHappen
                                    ? 'Practice attempted'
                                    : 'Practice not attempted'}
                              </span>

                              {/* { Link to deliverable } */}
                              {
                                practice.didHappen !== null &&
                                practice.didHappen &&
                                practice.deliverable !== null ? (
                                  // Case 1: practice happened and deliverable was specified
                                  <div className="mx-auto">
                                    {practice.deliverable !== '' ? (
                                      <div className="flex flex-row items-center text-xs font-normal">
                                        <LinkIcon className="mr-1 h-4 stroke-2 text-green-600" />
                                        <a
                                          href={practice.deliverable}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-600 underline"
                                        >
                                          Deliverable{' '}
                                        </a>
                                        {/* {practice.yellkey == null ? (
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
                                    )} */}
                                      </div>
                                    ) : (
                                      <div className="flex flex-row items-center text-xs font-normal text-rose-600">
                                        <LinkIcon className="mr-1 h-4 stroke-2" />
                                        No deliverable link
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  // Case 2: practice happened but no deliverable was specified
                                  practice.didHappen &&
                                  practice.type !== 'Reflect After Sprint' &&
                                  practice.deliverable === null && (
                                    <div className="mx-auto">
                                      <div className="flex flex-row items-center text-xs font-normal text-rose-600">
                                        <LinkIcon className="mr-1 h-4 stroke-2" />
                                        No deliverable link
                                      </div>
                                    </div>
                                  )
                                )
                                // Case 3: practice did not happen (do nothing)
                              }
                            </div>

                            {/* Student's deliverable notes */}
                            {practice.didHappen !== null &&
                              practice.deliverableNotes !== null && (
                                <div className="mt-0.5 text-xs">
                                  <div className="">
                                    Student notes on deliverable:{' '}
                                  </div>
                                  <div className="">
                                    <span className="text-green-600">
                                      {practice.deliverableNotes}
                                    </span>
                                  </div>
                                </div>
                              )}

                            {/* { Reflections } */}
                            <div className="mt-1 w-full">
                              {practice.reflections !== null &&
                              practice.reflections.length > 0 ? (
                                <>
                                  <h3 className="border-b text-xs font-bold">
                                    Reflections
                                  </h3>
                                  {practice.reflections.map((reflection) => {
                                    return (
                                      <div
                                        key={reflection.prompt}
                                        className="mb-2 w-full text-xs"
                                      >
                                        <h4 className="font-medium">
                                          {reflection.prompt}
                                        </h4>
                                        {reflection.response === '' ? (
                                          <p className="text-rose-600">
                                            No response from student(s)
                                          </p>
                                        ) : (
                                          <p className="text-green-600">
                                            {reflection.response}
                                          </p>
                                        )}
                                      </div>
                                    );
                                  })}
                                </>
                              ) : (
                                <></>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : isLoading ? (
                <div className="text-xs italic text-blue-400">
                  Loading follow-up outcomes...
                </div>
              ) : (
                <div className="text-xs italic">
                  No follow-up outcomes to show.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
