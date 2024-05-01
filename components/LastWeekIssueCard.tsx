/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import ArchiveBoxIcon from '@heroicons/react/24/outline/ArchiveBoxIcon';
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';
import LockOpenIcon from '@heroicons/react/24/outline/LockOpenIcon';
import EyeSlashIcon from '@heroicons/react/24/outline/EyeSlashIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';

import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { shortDate } from '../lib/helperFns';
import { DragTypes } from '../controllers/draggable/dragTypes';

export default function LastWeekIssueCard({
  issueId,
  title,
  date,
  followUps,
  showLastWeeksIssues,
  setShowLastWeeksIssues,
  onDrag
}): JSX.Element {
  // store state for minimizing content
  const [shouldShow, setShouldShow] = useState(showLastWeeksIssues);

  // drag and drop functionality
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: DragTypes.PAST_ISSUE,
      item: { issueId },
      end(item, monitor) {
        const dropResult = monitor.getDropResult();

        // see if the note was dropped into an issue
        if (item && dropResult) {
          onDrag(item.issueId, dropResult.issue);
        }
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 'opacity-40' : 'opacity-100'
      })
    }),
    [issueId]
  );

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
    let practiceOutcome = followUps
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
  }, [followUps, date]);

  return (
    <div ref={drag} className={`flex flex-wrap border-4 p-1 ${opacity}`}>
      <div className={`w-full h-full`}>
        <>
          {/* Issue title */}
          <div className="p-2 mb-1 w-full flex flex-col">
            <div className="flex flex-row">
              <h2 className="text-base font-bold flex-auto">
                {title.length > 100
                  ? title.substring(0, 100 - 3) + '...'
                  : title.trim() === ''
                    ? 'click to enter title'
                    : title}
              </h2>

              {/* Show / hide issue */}
              {/* TODO: buggy since it doesn't update the parent state properly */}
              {/* <div>
                {showLastWeeksIssues && shouldShow ? (
                  <EyeSlashIcon
                    className={`h-10 text-slate-600`}
                    onClick={() => {
                      console.log('clicked hide');
                      setShouldShow(false);
                    }}
                  />
                ) : (
                  <>
                    <EyeIcon
                      className={`h-10 text-slate-600`}
                      onClick={() => {
                        console.log('clicked hide');
                        setShouldShow(true);

                        // set the state of the parent component
                        setShowLastWeeksIssues(true);
                      }}
                    />
                  </>
                )}
              </div> */}
            </div>

            <div className="text-xs">
              <h3 className="mt-1 font-medium">Updated: {date}</h3>
            </div>
          </div>
        </>

        {/* Show practice follow-ups */}
        {!isLoading &&
        showLastWeeksIssues &&
        shouldShow &&
        practiceOutcome !== null ? (
          <div className="w-full mt-8">
            <h2 className="text-md font-bold underline">
              Practice Outcomes from {shortDate(new Date(date))}
            </h2>
            <div className="flex flex-wrap">
              {practiceOutcome.map((practice) => {
                return (
                  <div key={practice.practice} className="w-full mb-4">
                    <h2 className="text-base">{practice.practice}</h2>

                    {/* Did the practice happen? */}
                    <div className="flex flex-wrap">
                      <div className="w-full">
                        <p className="text-normal font-semibold">
                          Did this happen?{' '}
                          <span
                            className={`font-normal ${practice.didHappen ? 'text-green-600' : 'text-rose-600'}`}
                          >
                            {practice.didHappen ? 'Yes' : 'No'}
                          </span>
                        </p>
                      </div>

                      {/* Link to deliverable */}
                      {practice.deliverable !== null ? (
                        <div className="w-full mt-1">
                          <p className="text-normal font-semibold">
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

                      {/* Reflections */}
                      {practice.reflections.length > 0 ? (
                        <div className="w-full mt-1">
                          <h3 className="text-normal font-bold">
                            Reflections:
                          </h3>
                          {practice.reflections.map((reflection) => {
                            return (
                              <div
                                key={reflection.prompt}
                                className="w-full mb-2"
                              >
                                <h4 className="text-normal font-medium">
                                  Q: {reflection.prompt}
                                </h4>
                                {reflection.response === '' ? (
                                  <p className="text-normal text-rose-600">
                                    No response from student
                                  </p>
                                ) : (
                                  <p className="text-normal text-green-600">
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
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
