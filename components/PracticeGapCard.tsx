/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';

import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { htmlToText, longDate, shortDate, shortenText } from '../lib/helperFns';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';
import { createNewPracticeGapObject } from '../controllers/practiceGapObjects/createPracticeGapObject';
import { createNewTextEntryBlock } from '../controllers/textEntryBlock/createNewTextEntryBlock';

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
      new Date(date).toISOString(),
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
      practiceToUpdate[practiceIndex].lastUpdated = new Date().toISOString();
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
      practiceToUpdate[practiceIndex].lastUpdated = new Date().toISOString();
      return practiceToUpdate;
    });
  };

  const onDrag = (sourcePracticeGap, targetCurrentIssue) => {
    let sourcePracticeId = sourcePracticeGap.id;
    let targetCurrentIssueId = targetCurrentIssue.id;

    // find index of the source practice
    let sourcePracticeIndex = practiceGapsData.findIndex(
      (practice) => practice.id === sourcePracticeId
    );
    let sourcePractice = practiceGapsData[sourcePracticeIndex];

    setCurrentIssuesData((prevData) => {
      // find the target issue index
      let newCurrentIssuesData = [...prevData];
      let targetIssueIndex = newCurrentIssuesData.findIndex(
        (issue) => issue.id === targetCurrentIssueId
      );
      let targetIssue = newCurrentIssuesData[targetIssueIndex];

      // add practice gap to the issue
      newCurrentIssuesData[targetIssueIndex].assessment.push(
        createNewTextEntryBlock(
          'note',
          [],
          `[practice gap] ${sourcePractice.title}`,
          `[practice gap] ${sourcePractice.title}`
        )
      );
      newCurrentIssuesData[targetIssueIndex].lastUpdated =
        new Date().toISOString();

      // add issue to practice gap
      setPracticeGapsData((prevData) => {
        let newPracticeGapsData = [...prevData];
        newPracticeGapsData[sourcePracticeIndex].prevIssues.push(targetIssue);
        return newPracticeGapsData;
      });

      return newCurrentIssuesData;
    });
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
      item: { id: practiceGapId, type: 'PracticeGapObject' },
      end(item, monitor) {
        const dropResult = monitor.getDropResult();

        // see if the note was dropped into an issue
        if (item && dropResult) {
          onDrag(item, dropResult);
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
    <>
      {(showPracticeGaps === 'Show Gaps' ||
        showPracticeGaps === 'Show Gaps with Details') && (
        <div
          ref={drag}
          className={`${className} p-1 ${opacity} ${isAddPractice ? 'border-2 border-dashed shadow-none' : 'border-4 shadow hover:border-4 hover:border-blue-300 hover:shadow-none'}`}
        >
          <div className={`h-full w-full`}>
            {isAddPractice ? (
              <>
                {/* Add practice card */}
                <div className="mx-auto my-auto flex h-full w-full flex-col items-center justify-center p-2">
                  <ContentEditable
                    id={`title-${practiceGapId}`}
                    html={titleRef.current}
                    onKeyUp={(e) => {
                      const practiceTitle = htmlToText(titleRef.current).trim();
                      if (e.key === 'Enter') {
                        // check if blank first
                        let input = practiceTitle;
                        if (input === '') {
                          return;
                        }

                        // add new practice and clear the text area
                        onAddPractice(input);
                        titleRef.current = '';
                      }

                      // set state holding issue to empty if enter was pressed, otherwise the current text
                      setNewPractice(practiceTitle);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      titleRef.current = e.target.value;
                    }}
                    className={`mb-2 mr-2 min-h-16 w-full flex-none break-words rounded-lg border p-1 text-xs font-normal empty:before:italic empty:before:text-slate-500 empty:before:content-['Describe_the_recurring_gap_in_self-regulation_skill...']`}
                  />
                  <h2 className="items-center text-center text-xs font-bold italic">
                    {newPractice.trim() === ''
                      ? '' // or drag a note onto this block (TODO: disabling this cuz it doesn't work right now)
                      : "hit 'Enter' to track self-regulation practice gap"}
                  </h2>
                </div>
              </>
            ) : (
              <>
                {/* Tracked Practice Gaps */}
                <div className="flex w-full flex-col p-1">
                  <div className="flex flex-row">
                    {/* Issue title */}
                    <ContentEditable
                      id={`title-${practiceGapId}`}
                      html={titleRef.current}
                      onChange={(e) => {
                        titleRef.current = e.target.value;
                        onEdit('title', htmlToText(titleRef.current).trim());
                      }}
                      className={`w-11/12 break-words rounded-md border p-0.5 text-xs font-normal empty:before:italic empty:before:text-slate-400 empty:before:content-['Title_of_practice_gap...']`}
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
                  </div>

                  {/* Issue description */}
                  {showPracticeGaps === 'Show Gaps with Details' && (
                    <ContentEditable
                      id={`description-${practiceGapId}`}
                      html={descriptionRef.current}
                      onChange={(e) => {
                        descriptionRef.current = e.target.value;
                        onEdit(
                          'description',
                          htmlToText(descriptionRef.current).trim()
                        );
                      }}
                      className={`mt-2 w-full flex-none rounded-md border p-0.5 text-xs empty:before:italic empty:before:text-slate-400 empty:before:content-['Describe_practice_gap...']`}
                    />
                  )}

                  {/* Prior instances */}
                  {showPracticeGaps === 'Show Gaps with Details' &&
                    priorInstances && (
                      <div className="flex flex-col">
                        <h3 className="mt-4 border-b border-black text-xs font-medium">
                          Past items of concern with practice gap
                        </h3>

                        {priorInstances.map((instance, idx) => (
                          <div key={idx} className="mb-2 flex flex-col">
                            <h2 className="mt-1 text-xs font-semibold">
                              {shortenText(instance.title, 50)} |{' '}
                              <span className="mt-1 text-2xs font-semibold">
                                {shortDate(new Date(instance.date))}
                              </span>
                            </h2>

                            <div className="w-full">
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
      )}
    </>
  );
}
