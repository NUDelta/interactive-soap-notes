/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';

import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { htmlToText, longDate, shortDate } from '../lib/helperFns';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';
import { createNewPracticeGapObject } from '../controllers/practiceGapObjects/createPracticeGapObject';

export default function PracticeGapCard({
  project,
  sig,
  date,
  practiceGapId,
  practiceGap,
  practiceGapsData,
  setPracticeGapsData,
  showPracticeGaps,
  setShowPracticeGaps,
  currentIssuesData,
  setCurrentIssuesData,
  className = '',
  dragType = DragTypes.PRACTICE
}): JSX.Element {
  // onAddIssue is a function that adds a new issue to the current issues
  const onAddPractice = (newPracticeGapTitle) => {
    // create a new practice
    let newPractice = createNewPracticeGapObject(
      newPracticeGapTitle,
      project,
      sig,
      '',
      date,
      [],
      true
    );

    // add the new practice to the practice gaps
    setPracticeGapsData((prevData) => {
      return [...prevData, newPractice];
    });
  };

  // onDeleteIssue is a function that sets the issue as deleted
  const onResolved = (e) => {
    // confirm if the user wants to resolve the issue
    if (
      !confirm(
        `Are you sure you want mark, "${practiceGap.title}", as resolved?`
      )
    ) {
      return;
    }

    // update the practice gaps
    setPracticeGapsData((prevData) => {
      let practiceToUpdate = [...prevData];
      let practiceIndex = practiceToUpdate.findIndex(
        (i) => i.id === practiceGapId
      );
      practiceToUpdate[practiceIndex].practiceInactive = true;
      practiceToUpdate[practiceIndex].lastUpdated = longDate(new Date());
      return practiceToUpdate;
    });
  };

  const onEdit = (field, edits) => {
    setPracticeGapsData((prevData) => {
      let practiceToUpdate = [...prevData];
      let practiceIndex = practiceToUpdate.findIndex(
        (i) => i.id === practiceGapId
      );
      practiceToUpdate[practiceIndex][field] = edits;
      practiceToUpdate[practiceIndex].lastUpdated = longDate(new Date());
      return practiceToUpdate;
    });
  };

  const onDrag = () => (sourcePracticeId, targetCurrentIssueId) => {
    // find index of the source practice
    let sourcePracticeIndex = practiceGapsData.findIndex(
      (practice) => practice.id === sourcePracticeId
    );
    let sourcePractice = practiceGapsData[sourcePracticeIndex];

    // find the target issue index
    let targetIssueIndex = currentIssuesData.findIndex(
      (issue) => issue.id === targetCurrentIssueId
    );
    let targetIssue = currentIssuesData[targetIssueIndex];

    // TODO: 05-14-24 -- add the ability to drag a practice gap onto an issue

    // update state
    // setCAPData((prevCapData) => {
    //   let newCAPData = {
    //     ...prevCapData
    //   };

    //   // attach practice to targetIssue as an assessment
    //   let newAssessment = {
    //     id: new mongoose.Types.ObjectId().toString(),
    //     type: 'note',
    //     context: [],
    //     value: `[practice gap] ${sourcePractice.title}`
    //   };

    //   // check if last assessment is blank before adding
    //   if (
    //     targetIssue.assessment.length === 1 &&
    //     targetIssue.assessment[0].value.trim() === ''
    //   ) {
    //     newCAPData.currentIssues[targetIssueIndex].assessment = [newAssessment];
    //   } // check if the last assessment is blank
    //   else if (
    //     newCAPData.currentIssues[targetIssueIndex].assessment[
    //       newCAPData.currentIssues[targetIssueIndex].assessment.length - 1
    //     ].value.trim() === ''
    //   ) {
    //     newCAPData.currentIssues[targetIssueIndex].assessment[
    //       newCAPData.currentIssues[targetIssueIndex].assessment.length - 1
    //     ] = newAssessment;
    //   } else {
    //     newCAPData.currentIssues[targetIssueIndex].assessment.push(
    //       newAssessment
    //     );
    //   }

    //   // update the last updated timestamp
    //   newCAPData.currentIssues[targetIssueIndex].lastUpdated = longDate(
    //     new Date()
    //   );

    //   // attach the current issue as an instance to the practice
    //   let newIssueInstance = {
    //     id: targetIssue.id,
    //     title: targetIssue.title,
    //     date: targetIssue.date,
    //     lastUpdated: targetIssue.lastUpdated
    //   };
    //   newCAPData.trackedPractices[sourcePracticeIndex].prevIssues.push(
    //     targetIssue
    //   );

    //   // return the new data
    //   return newCAPData;
    // });
  };

  // special case for adding a new practice gap
  const isAddPractice = practiceGapId === 'add-practice';

  // store state for minimizing content
  const [shouldShow, setShouldShow] = useState(true);

  // store state for add practice
  const [newPractice, setNewPractice] = useState('');

  // create refs for title and description
  const titleRef = useRef(practiceGap === null ? '' : practiceGap.title);
  const descriptionRef = useRef(
    practiceGap === null ? '' : practiceGap.description
  );

  // store prior instances
  const priorInstances = practiceGap === null ? [] : practiceGap.prevIssues;

  // TODO: 04-30-24 -- probably should allow dropping onto practice from issues
  // drag and drop functionality
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: DragTypes.PRACTICE,
      item: { issueId: practiceGapId },
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
    [practiceGapId]
  );

  // TODO: 04-30-24 -- see this example for drag and drop https://codesandbox.io/p/sandbox/github/react-dnd/react-dnd/tree/gh-pages/examples_js/04-sortable/simple?file=%2Fsrc%2FCard.js%3A69%2C18&from-embed=
  return (
    // TODO: the basis needs to be configurable.
    <div
      ref={drag}
      className={`${className} p-1 ${opacity} ${isAddPractice ? 'border-2 border-dashed shadow-none' : 'border-4 shadow hover:border-4 hover:border-blue-300 hover:shadow-none'}`}
    >
      <div className={`w-full h-full`}>
        {isAddPractice ? (
          <>
            {/* Add practice card */}
            <div className="p-2 flex flex-col w-full h-full mx-auto my-auto items-center justify-center">
              <ContentEditable
                id={`title-${practiceGapId}`}
                html={titleRef.current}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    // check if blank first
                    let input = titleRef.current;
                    if (input === '') {
                      return;
                    }

                    // add new practice and clear the text area
                    onAddPractice(input);
                    titleRef.current = '';
                  }

                  // set state holding issue to empty if enter was pressed, otherwise the current text
                  setNewPractice(titleRef.current);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  titleRef.current = htmlToText(e.target.value);
                }}
                className={`p-1 mr-2 w-full min-h-16 mb-2 break-words flex-none empty:before:content-['Describe_the_recurring_gap_in_self\-regulation_skill...'] empty:before:italic empty:before:text-slate-500 border text-xs font-normal rounded-lg`}
              />
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
                  id={`title-${practiceGapId}`}
                  html={titleRef.current}
                  onChange={(e) => {
                    titleRef.current = htmlToText(e.target.value);
                    onEdit('title', titleRef.current);
                  }}
                  className={`p-0.5 break-words w-11/12 empty:before:content-['Title_of_practice_gap...'] empty:before:italic empty:before:text-slate-400 border rounded-md text-xs font-normal`}
                />

                {/* Resolve and archive buttons */}
                {!isAddPractice && (
                  <div className="w-1/12">
                    <CheckBadgeIcon
                      onClick={(e) => onResolved(e)}
                      className="mx-auto h-6 text-gray-600 hover:text-green-600"
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

              {/* Issue description */}
              {showPracticeGaps && (
                <ContentEditable
                  id={`description-${practiceGapId}`}
                  html={descriptionRef.current}
                  onChange={(e) => {
                    descriptionRef.current = htmlToText(e.target.value);
                    onEdit('description', e.target.value);
                  }}
                  className={`p-0.5 text-xs mt-2 flex-none w-full empty:before:content-['Describe_practice_gap...'] empty:before:italic empty:before:text-slate-400 border rounded-md`}
                />
              )}

              {/* Prior instances */}
              {showPracticeGaps && priorInstances && (
                <div className="flex flex-col">
                  <h3 className="mt-4 text-xs font-medium border-b border-black">
                    Past items of concern with this practice gap:
                  </h3>

                  {priorInstances.map((instance, idx) => (
                    <div key={idx} className="flex flex-col mb-2">
                      <h2 className="mt-1 text-xs font-semibold">
                        {instance.title} |{' '}
                        <span className="mt-1 text-2xs font-semibold">
                          {shortDate(new Date(instance.date))}
                        </span>
                      </h2>

                      <div className="w-full">
                        <h3 className="text-xs border-b">Context from issue</h3>
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
