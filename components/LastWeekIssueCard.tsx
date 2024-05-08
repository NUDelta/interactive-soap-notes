/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';

export default function LastWeekIssueCard({
  issueId,
  title,
  date,
  selectedIssue,
  setSelectedIssue,
  onDrag
}): JSX.Element {
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

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

  return (
    <div
      ref={drag}
      className={`basis-1/4 shrink-0 border-4 p-1 ${selectedIssue === issueId && 'bg-blue-200'} border hover:bg-blue-100 ${opacity}`}
      onClick={() => {
        setIsSelected(!isSelected);
        if (issueId === selectedIssue) {
          // set default to this week's notes
          setSelectedIssue('this-weeks-notes');
        } else {
          setSelectedIssue(issueId);
        }
      }}
    >
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

            {/* <div className="text-xs">
              <h3 className="mt-1 font-medium">Updated: {date}</h3>
            </div> */}

            {/* TODO: 05-07-24 maybe show that there are missing deliverables */}
          </div>
        </>
      </div>
    </div>
  );
}
