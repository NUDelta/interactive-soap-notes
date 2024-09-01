/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import React, { useState } from 'react';
import { useDrag } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';
import { createNewIssueObject } from '../controllers/issueObjects/createIssueObject';
import CalendarIcon from '@heroicons/react/24/outline/CalendarIcon';

export default function LastWeekIssueCard({
  issueId,
  title,
  date,
  noteDate,
  selectedIssue,
  setSelectedIssue,
  pastIssuesData,
  setPastIssuesData,
  currentIssuesData,
  setCurrentIssuesData
}): JSX.Element {
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  const onDrag = (sourceIssue, targetIssue) => {
    let sourceIssueId = sourceIssue.id;
    let targetIssueId = targetIssue.id;

    // find index of the source issue
    let sourceIssueIndex = pastIssuesData.findIndex(
      (issue) => issue.id === sourceIssueId
    );
    let sourcePastIssue = pastIssuesData[sourceIssueIndex];
    console.log('sourcePastIssue:', sourcePastIssue);

    // check that the targetIssueId is add-practice
    if (targetIssueId === 'add-issue') {
      // create a new issue
      setCurrentIssuesData((prevCurrentIssuesData) => {
        let newIssue = createNewIssueObject(
          sourcePastIssue.title,
          sourcePastIssue.project,
          sourcePastIssue.sig,
          new Date(noteDate).toISOString(),
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
      item: { id: issueId, type: 'LastWeekIssueObject' },
      end(item, monitor) {
        const dropResult = monitor.getDropResult() as { issue: string };

        // see if the note was dropped into an issue
        if (item && dropResult) {
          onDrag(item, dropResult);
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
      className={`shrink-0 basis-1/3 border p-1 shadow ${selectedIssue === issueId && 'bg-blue-200'} border-4 shadow hover:border-4 hover:border-blue-300 hover:shadow-none ${opacity}`}
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
      <div className={`h-full w-full`}>
        <>
          {/* Issue title */}
          <div className="flex w-full flex-col p-1">
            <h2 className="mb-auto text-xs font-semibold">{title}</h2>

            {/* TODO: 05-07-24 maybe show that there are missing deliverables */}
            <div className="mt-2 flex flex-row items-center text-2xs font-medium text-blue-600">
              <CalendarIcon className="mr-1 h-4" />
              Tracked from last coaching meeting
            </div>

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
        </>
      </div>
    </div>
  );
}
