/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';

import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { shortDate } from '../lib/helperFns';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';

export default function PracticeGapCard({
  issueId,
  title,
  description,
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
      className={`flex-none basis-1/6 border-4 p-1 ${opacity} ${isAddPractice ? 'border-dashed' : 'border hover:bg-blue-100'}`}
    >
      <div className={`w-full h-full`}>
        {isAddPractice ? (
          <>
            {/* Add practice card */}
            <div className="p-1 flex flex-col w-full h-full mx-auto my-auto items-center justify-center">
              <textarea
                className="w-full h-3/4 text-xs"
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
              <h2 className="text-xs font-bold italic items-center">
                {newPractice.trim() === ''
                  ? 'or drag a note onto this block'
                  : "hit 'Enter' to add practice gap"}
              </h2>
            </div>
          </>
        ) : (
          <>
            {/* Tracked Practice Gaps */}
            <div className="p-1 w-full flex flex-col">
              <div className="flex flex-row">
                {/* Issue title */}
                <ContentEditable
                  id={`title-${issueId}`}
                  html={titleRef.current}
                  onChange={(e) => {
                    titleRef.current = e.target.value;
                    onEdit('title', e.target.value);
                  }}
                  className={`p-0.5 break-words w-11/12 flex-none empty:before:content-['Title_of_practice_gap...'] empty:before:italic empty:before:text-slate-400 border rounded-md text-xs font-semibold`}
                />

                {/* Resolve and archive buttons */}
                {!isThisWeek && !isAddPractice && !issueIsResolved && (
                  <div>
                    <CheckBadgeIcon
                      onClick={(e) => onResolved(e)}
                      className="ml-1 h-6 text-gray-600 hover:text-green-600"
                    />
                  </div>
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

              {showPracticeGaps && (
                <div className="mb-2">
                  <h3 className="text-xs font-medium">
                    Last noticed: {lastUpdated}
                  </h3>
                </div>
              )}

              {/* Issue description */}
              {showPracticeGaps && (
                <ContentEditable
                  id={`description-${issueId}`}
                  html={descriptionRef.current}
                  onChange={(e) => {
                    descriptionRef.current = e.target.value;
                    onEdit('description', e.target.value);
                  }}
                  className={`p-0.5 text-xs flex-none w-full empty:before:content-['Describe_practice_gap...'] empty:before:italic empty:before:text-slate-400 border rounded-md`}
                />
              )}

              {/* Prior instances */}
              {showPracticeGaps && priorInstances && (
                <div className="flex flex-col">
                  <h3 className="mt-4 text-sm font-medium border-b border-black">
                    Past issues with this practice gap:
                  </h3>

                  {priorInstances.map((instance, idx) => (
                    <div key={idx} className="flex flex-col">
                      <h4 className="mt-1 text-sm font-semibold">
                        {instance.title} | {shortDate(new Date(instance.date))}
                      </h4>
                      <div className="w-full">
                        <h3 className="text-sm">Context from instance</h3>
                        {instance.context.map((context, idx) => (
                          <div key={idx} className="text-xs">
                            {context.value.trim() !== '' && (
                              <p>- {context.value}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {priorInstances.length === 0 && (
                    <div>
                      <h4 className="text-xs italic">
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
