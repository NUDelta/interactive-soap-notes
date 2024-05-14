import NoteBlock from './NoteBlock';
import PracticeGapCard from './PracticeGapCard';
import { useEffect, useState } from 'react';

export default function LastWeekIssuePane({
  issueId,
  pastIssuesData,
  setPastIssuesData,
  practiceGapData,
  setPracticeGapData
}): JSX.Element {
  // get the issue from soapData with the given issueId
  const issueIndex = pastIssuesData.findIndex((issue) => issue.id === issueId);
  const selectedLastWeekIssue = pastIssuesData[issueIndex];
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

  // TODO: 05-13-24 -- practices should be linked into context for a note block, and then shown here if they are linked to the assessment
  let relevantPractices = practiceGapData.filter((practice) => {
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

  console.log('selectedLastWeekIssue', selectedLastWeekIssue);
  console.log('nonEmptyAssessmentLength', nonEmptyAssessmentLength);
  console.log('relevantPractices', relevantPractices);

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
          practice: followUp.parsedPractice.practice,
          didHappen: followUp.outcome.didHappen,
          deliverable: followUp.practice.includes('[reflect]')
            ? null
            : followUp.outcome.deliverableLink,
          reflections: followUp.outcome.didHappen // TODO: lot of repetitive code
            ? followUp.outcome.reflections[1]
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
            : followUp.outcome.reflections[0]
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
          <div className="flex flex-wrap w-full">
            {/* Split Pane in half with assesments on 1/3 */}
            <div className="w-full flex flex-row">
              <div className="w-1/4 flex flex-col mr-6">
                <h1 className="font-bold text-base">Assessments for Issue</h1>
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
                    <div className="text-xs italic">
                      No assessments written for issue
                    </div>
                  )}
                </div>
              </div>

              {/* Show practice gaps linked to issue */}
              <div className="w-3/4">
                <div>
                  <h1 className="font-bold text-base">
                    Practice Gaps for Issue
                  </h1>
                </div>

                <div className="flex flex-row gap-2 flex-nowrap overflow-auto">
                  {relevantPractices.length !== 0 && (
                    <>
                      {/* TODO: NOT EDITABLE */}
                      {/* TODO: 05-14-24 should be able to minimize practice gaps */}
                      {relevantPractices.map((practiceGap) => (
                        <PracticeGapCard
                          key={`issue-card-${practiceGap.id}`}
                          // project={noteInfo.project}
                          // sig={noteInfo.sigName}
                          // date={noteInfo.sigDate}
                          practiceGapId={practiceGap.id}
                          practiceGap={practiceGap}
                          practiceGapsData={practiceGapData}
                          setPracticeGapsData={setPracticeGapData}
                          showPracticeGaps={true}
                          className="flex-none basis-1/3"
                          // setShowPracticeGaps={setShowPracticeGaps}
                          // currentIssuesData={currentIssuesData}
                          // setCurrentIssuesData={setCurrentIssuesData}
                        />
                      ))}
                    </>
                  )}
                  {relevantPractices.length === 0 && (
                    <div className="text-xs italic">
                      No practice gaps linked to this issue.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-up objects on the remaining */}
            <div className="w-full">
              <h1 className="font-bold text-base">Follow-Up Outcomes</h1>
              {/* Show practice follow-ups */}
              {!isLoading &&
              practiceOutcome !== null &&
              practiceOutcome.length > 0 ? (
                <div className="flex flex-row gap-2">
                  {practiceOutcome.map((practice) => {
                    return (
                      <div
                        key={practice.practice}
                        className="w-full mb-4 p-2 border shadow"
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
