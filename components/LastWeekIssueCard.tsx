/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';
import { createNewIssueObject } from '../controllers/issueObjects/createIssueObject';

export default function LastWeekIssueCard({
  issueId,
  title,
  date,
  selectedIssue,
  setSelectedIssue,
  pastIssuesData,
  setPastIssuesData,
  currentIssuesData,
  setCurrentIssuesData
}): JSX.Element {
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  const onDrag = (sourceIssueId, targetIssueId) => {
    // find index of the source issue
    let sourceIssueIndex = pastIssuesData.findIndex(
      (issue) => issue.id === sourceIssueId
    );
    let sourcePastIssue = pastIssuesData[sourceIssueIndex];

    // check that the targetIssueId is add-practice
    if (targetIssueId === 'add-practice') {
      // create a new issue
      setCurrentIssuesData((prevCurrentIssuesData) => {
        let newIssue = createNewIssueObject(
          sourcePastIssue.title,
          sourcePastIssue.project,
          sourcePastIssue.sig,
          date,
          [sourcePastIssue.id]
        );

        let newCurrentIssuesData = [...prevCurrentIssuesData, newIssue];
        return newCurrentIssuesData;
      });
    }
  };

  // drag and drop functionality
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: DragTypes.PAST_ISSUE,
      item: { issueId },
      end(item, monitor) {
        const dropResult = monitor.getDropResult() as { issue: string };

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
      className={`basis-1/3 shrink-0 p-1 border shadow ${selectedIssue === issueId && 'bg-blue-200'} border-4 shadow hover:border-4 hover:border-blue-300 hover:shadow-none ${opacity}`}
      onClick={() => {
        setIsSelected(!isSelected);
        if (issueId === selectedIssue) {
          // set default to this week's notes
          setSelectedIssue(null);
        } else {
          setSelectedIssue(issueId);
        }
      }}
    >
      <div className={`w-full h-full`}>
        <>
          {/* Issue title */}
          <div className="p-1 w-full flex flex-col">
            <h2 className="text-xs font-semibold mb-auto">
              {title.length > 100
                ? title.substring(0, 100 - 3) + '...'
                : title.trim() === ''
                  ? 'click to enter title'
                  : title}
            </h2>
            <h1 className="text-xs italic mt-auto">
              Tracked from last SIG meeting
            </h1>

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

            {/* TODO: 05-07-24 maybe show that there are missing deliverables */}
          </div>
        </>
      </div>
    </div>
  );
}
