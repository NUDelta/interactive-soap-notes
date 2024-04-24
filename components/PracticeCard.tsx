/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import ArchiveBoxIcon from '@heroicons/react/24/outline/ArchiveBoxIcon';
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';
import LockOpenIcon from '@heroicons/react/24/outline/LockOpenIcon';

import React, { useState } from 'react';
import { useDrop } from 'react-dnd';

export default function PracticeCard({
  issueId,
  title,
  description,
  lastUpdated,
  selectedIssue,
  setSelectedIssue,
  currInstance,
  priorInstances = undefined,
  issueIsResolved,
  onResolved,
  onArchive,
  onAddPractice = undefined,
  noteDate
}): JSX.Element {
  // special cases for this week's notes and add practice
  const isThisWeek = issueId === 'this-weeks-notes';
  const isAddPractice = issueId === 'add-practice';

  // get the last prior instance, if provided
  // prior instances are ordered by date, so the first one is the most recent
  let lastPriorInstance = null;
  let practiceOutcome = null;
  if (priorInstances !== undefined && priorInstances.length > 0) {
    lastPriorInstance = priorInstances[0];

    // TODO: 04-23-24 buggy -- probably a simpler way
    // check if lastUpdated is today and lastPriorInstance is no more than 10 days before last updated
    const lastUpdatedDate = new Date(lastUpdated);
    const lastPriorInstanceDate = new Date(lastPriorInstance.date);
    const timeDiff = Math.abs(
      lastUpdatedDate.getTime() - lastPriorInstanceDate.getTime()
    );
    const issueDiffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const parsedNoteDate = new Date(noteDate);
    const timeDiffToday = Math.abs(
      parsedNoteDate.getTime() - lastUpdatedDate.getTime()
    );
    const diffDaysNotePractice = Math.ceil(timeDiffToday / (1000 * 3600 * 24));

    // note date and date of practice should be less than 10
    if (diffDaysNotePractice > 10) {
      lastPriorInstance = null;
    } else {
      // create an object that holds all the practices, their outcome, and the deliverables / reflections
      practiceOutcome = lastPriorInstance.followUps
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
                if (followUp.practice.includes('[reflect]')) {
                  return true;
                }

                return (
                  (followUp.outcome.didHappen &&
                    reflection.prompt.includes('If yes') &&
                    !reflection.prompt.includes(
                      'share a link to any deliverable'
                    )) ||
                  (!followUp.outcome.didHappen &&
                    reflection.prompt.includes('If not'))
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
    }
  }
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  // drag and drop colors
  function selectBackgroundColor(isActive, canDrop) {
    // color of the card the dragged element is hovering over
    if (isActive) {
      return 'bg-green-500';
    }
    // color of cards that the dragged element can be dropped on
    else if (canDrop) {
      return 'bg-green-300';
    }
    // default color
    else {
      return 'bg-transparent';
    }
  }

  // drag and drop functionality
  const allowedDropEffect = isThisWeek ? null : 'move';
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      // what kinds of draggable items can be accepted into the issue
      accept: 'NOTE_BLOCK',

      // info for target item the draggable element is trying to be added to
      drop: () => ({
        name: `${allowedDropEffect} to issue: ${title}`,
        allowedDropEffect,
        issue: issueId
      }),
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      })
    }),
    [allowedDropEffect]
  );
  const isActive = canDrop && isOver;
  const backgroundColor = selectBackgroundColor(isActive, canDrop);

  return (
    <div
      ref={drop}
      className={`flex flex-wrap border-4 p-1 ${selectedIssue === issueId && !isActive ? 'bg-blue-200' : backgroundColor} ${isAddPractice ? 'border-dashed' : 'border hover:bg-blue-100'}`}
      onClick={() => {
        if (!isAddPractice) {
          setIsSelected(!isSelected);
          if (issueId === selectedIssue) {
            // set default to this week's notes
            setSelectedIssue('this-weeks-notes');
          } else {
            setSelectedIssue(issueId);
          }
        }
      }}
    >
      <div className={`w-full h-full`}>
        {isAddPractice ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex flex-col w-1/2 h-full mx-auto items-center justify-center">
              <textarea
                className="w-full mx-auto text-base"
                placeholder="Type a new practice and hit enter..."
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    // check if blank first
                    let input = e.target.value.trim();
                    if (input === '') {
                      return;
                    }

                    // add new practice
                    onAddPractice(input);

                    // clear the textarea
                    e.target.value = '';
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              ></textarea>
              <h2 className="text-base font-bold items-center">
                <span className="text-sm italic">
                  or drag a note onto this block...
                </span>
              </h2>
            </div>
          </>
        ) : (
          <>
            {/* Issue title */}
            <div className="p-2 mb-1 w-full">
              <div className="flex">
                <h2 className="text-base font-bold flex-auto">
                  {title.length > 100
                    ? title.substring(0, 100 - 3) + '...'
                    : title.trim() === ''
                      ? 'click to enter title'
                      : title}
                </h2>
              </div>

              <div className="text-xs">
                <h3 className="mt-1 font-medium">Updated: {lastUpdated}</h3>
              </div>

              {/* Issue description */}
              <div className="mt-1">
                {description.trim() === '' ? (
                  // <p className="text-base italic">No description available</p>
                  <></>
                ) : (
                  <p className="text-base">{description}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Resolve and archive buttons */}
        {!isThisWeek && !isAddPractice ? (
          <div className="w-full flex flex-row mt-auto">
            {!issueIsResolved ? (
              <>
                <div>
                  <CheckBadgeIcon
                    onClick={(e) => onResolved(e)}
                    className="ml-2 h-8 text-gray-600 hover:text-green-600"
                  />
                </div>
                <div>
                  <ArchiveBoxIcon
                    onClick={(e) => onArchive(e)}
                    className="ml-2 h-8 text-gray-600 hover:text-red-600"
                  />
                </div>
              </>
            ) : (
              <div>
                <LockOpenIcon
                  onClick={(e) => onResolved(e)}
                  className="ml-2 h-8 text-gray-600"
                />
              </div>
            )}
            <div className="">
              <ExclamationTriangleIcon
                className={`ml-2 h-8 text-orange-600 ${
                  currInstance !== null &&
                  currInstance.plan.some((currPlan) => {
                    return currPlan.value.trim() !== '';
                  })
                    ? 'opacity-0'
                    : currInstance === null
                      ? 'opacity-0'
                      : ''
                }`}
              />
            </div>
          </div>
        ) : (
          <></>
        )}

        {/* Show practice follow-ups */}
        {practiceOutcome !== null ? (
          <div className="w-full mt-8">
            <h2 className="text-md font-bold underline">Practice Outcomes</h2>
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
                            Deliverable:{' '}
                            {practice.deliverable !== '' ? (
                              <a
                                href={practice.deliverable}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 underline font-normal"
                              >
                                Link to deliverable
                              </a>
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
