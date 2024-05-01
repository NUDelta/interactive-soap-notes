/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';

import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { shortDate } from '../lib/helperFns';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';

export default function PracticeCard({
  issueId,
  title,
  description,
  date,
  lastUpdated,
  priorInstances = null,
  issueIsResolved,
  showPracticeGaps,
  onResolved,
  onArchive,
  onAddPractice,
  onEdit,
  dragType = DragTypes.PRACTICE,
  onDrag
}): JSX.Element {
  // special cases for this week's notes and add practice
  const isThisWeek = issueId === 'this-weeks-notes';
  const isAddPractice = issueId === 'add-practice';

  // store state for minimizing content
  const [shouldShow, setShouldShow] = useState(true);

  // store state for add practice
  const [newPractice, setNewPractice] = useState('');

  // create refs for title and description
  const titleRef = useRef(title);
  const descriptionRef = useRef(description);

  // TODO: 04-30-24 -- probably should allow dropping onto practice from issues
  // drag and drop functionality
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: DragTypes.PRACTICE,
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

  // TODO: 04-30-24 -- see this example for drag and drop https://codesandbox.io/p/sandbox/github/react-dnd/react-dnd/tree/gh-pages/examples_js/04-sortable/simple?file=%2Fsrc%2FCard.js%3A69%2C18&from-embed=
  return (
    <div
      ref={drag}
      className={`flex flex-wrap border-4 p-1 ${opacity} ${isAddPractice ? 'border-dashed' : 'border hover:bg-blue-100'}`}
    >
      <div className={`w-full h-full`}>
        {isAddPractice ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex flex-col w-full h-full mx-auto my-auto items-center justify-center">
              <textarea
                className="w-full h-3/4 text-base"
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

                  setNewPractice(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              ></textarea>
              <h2 className="text-base font-bold items-center">
                <span className="text-sm italic">
                  {newPractice.trim() === ''
                    ? 'or drag a note from the right onto this block'
                    : "hit 'Enter' to add practice gap"}
                </span>
              </h2>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 mb-1 w-full flex flex-col">
              <div className="flex flex-row">
                {/* Issue title */}
                <div className="w-11/12">
                  <ContentEditable
                    id={`title-${issueId}`}
                    html={titleRef.current}
                    onChange={(e) => {
                      titleRef.current = e.target.value;
                      onEdit('title', e.target.value);
                    }}
                    className={`p-0.5 flex-none w-full empty:before:content-['Title_of_practice_gap...'] empty:before:italic empty:before:text-slate-400 border text-base font-bold rounded-lg`}
                  />
                </div>

                {/* Resolve and archive buttons */}
                {!isThisWeek && !isAddPractice ? (
                  <div className="flex flex-row">
                    {!issueIsResolved ? (
                      <>
                        <div>
                          <CheckBadgeIcon
                            onClick={(e) => onResolved(e)}
                            className="ml-2 h-8 text-gray-600 hover:text-green-600"
                          />
                        </div>
                        {/* <div>
                          <ArchiveBoxIcon
                            onClick={(e) => onArchive(e)}
                            className="ml-2 h-8 text-gray-600 hover:text-red-600"
                          />
                        </div> */}
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                ) : (
                  <></>
                )}

                {/* Show / hide details */}
                {/* TODO: buggy */}
                {/* <div>
                  {shouldShow ? (
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
                        }}
                      />
                    </>
                  )}
                </div> */}
              </div>

              <div className="text-xs mb-2">
                <h3 className="mt-1 font-medium">First Tracked: {date}</h3>
                <h3 className="mt-1 font-medium">
                  Last Updated: {lastUpdated}
                </h3>
              </div>

              {/* Issue description */}
              {showPracticeGaps && (
                <ContentEditable
                  id={`description-${issueId}`}
                  html={descriptionRef.current}
                  onChange={(e) => {
                    descriptionRef.current = e.target.value;
                    onEdit('description', e.target.value);
                  }}
                  className={`p-0.5 flex-none w-full empty:before:content-['Describe_practice_gap...'] empty:before:italic empty:before:text-slate-400 border rounded-lg`}
                />
              )}

              {/* Prior instances */}
              {showPracticeGaps && priorInstances && (
                <div className="flex flex-col">
                  <h3 className="mt-4 font-medium border-b border-black">
                    Project issues that had this this practice gap in the past:
                  </h3>

                  {priorInstances.map((instance, idx) => (
                    <div key={idx} className="flex flex-col">
                      <h4 className="mt-1 text-normal font-normal">
                        {instance.title}
                      </h4>
                      <span className="text-xs">
                        {shortDate(new Date(instance.date))}
                      </span>
                      {instance.plan.map((plan, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="w-11/12">
                            <p>{plan.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}

                  {priorInstances.length === 0 && (
                    <div>
                      <h4 className="italic">
                        No issues have this practice gap attached
                      </h4>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
