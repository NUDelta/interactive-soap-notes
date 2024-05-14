/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';
import { createNewIssueObject } from '../controllers/issueObjects/createIssueObject';
import { htmlToText, longDate, serializeDates } from '../lib/helperFns';

export default function CurrWeekIssueCard({
  project,
  sig,
  date,
  issueId,
  issue,
  selectedIssue,
  setSelectedIssue,
  currentIssuesData,
  setCurrentIssuesData
}): JSX.Element {
  // onAddIssue is a function that adds a new issue to the current issues
  const onAddIssue = (newIssueTitle) => {
    let newIssueForWeek = serializeDates(
      createNewIssueObject(newIssueTitle, project, sig, date, [], true)
    );
    setCurrentIssuesData((prevData) => {
      return [...prevData, newIssueForWeek];
    });
  };

  // onDeleteIssue is a function that sets the issue as deleted
  const onDeleteIssue = () => {
    // confirm if the user wants to delete the issue
    if (
      !confirm(
        `Are you sure you want to delete, "${issue.title}"? This cannot be undone.`
      )
    ) {
      return;
    }

    // set the issue as deleted by updating the wasDeleted flag
    setCurrentIssuesData((prevData) => {
      let issuesToUpdate = [...prevData];
      let issueIndex = issuesToUpdate.findIndex((i) => i.id === issueId);
      issuesToUpdate[issueIndex].lastUpdated = longDate(new Date());
      issuesToUpdate[issueIndex].wasDeleted = true;
      return issuesToUpdate;
    });

    // check if this issue was selected
    if (selectedIssue === issueId) {
      setSelectedIssue(null);
    }
  };

  // onTitleEdit is a function that updates the title of the issue
  const onTitleEdit = (value) => {
    setCurrentIssuesData((prevData) => {
      let issuesToUpdate = [...prevData];
      let issueIndex = issuesToUpdate.findIndex((i) => i.id === issueId);
      issuesToUpdate[issueIndex].title = value;
      return issuesToUpdate;
    });
  };

  // TODO: 05-13-24 -- add a drag to notes and onto another issue card
  // init variables for the view
  const title = issue === null ? '' : issue.title;
  const lastUpdated = issue === null ? '' : issue.lastUpdated;

  // special cases for this week's notes and add issue
  const isThisWeek = issueId === 'this-weeks-notes';
  const isAddIssue = issueId === 'add-issue';

  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  // store state for add issue
  const [newIssue, setNewIssue] = useState('');

  // create ref for title
  const titleRef = useRef(title);

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
  const ref = useRef(null);
  const allowedDropEffect = isThisWeek ? null : 'move';
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      // TODO: 04-30-24 -- allow dropping of note block and practice
      // what kinds of draggable items can be accepted into the issue
      accept: isAddIssue
        ? [DragTypes.NOTE_BLOCK, DragTypes.PAST_ISSUE]
        : [DragTypes.NOTE_BLOCK, DragTypes.PRACTICE],

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

  const [{ opacity }, drag] = useDrag(
    () => ({
      type: isAddIssue ? '' : DragTypes.CURRENT_ISSUE,
      item: { issueId },
      end(item, monitor) {
        const dropResult = monitor.getDropResult();

        // see if the note was dropped into an issue
        if (item && dropResult) {
          console.log('dragging practice');
        }
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 'opacity-40' : 'opacity-100'
      })
    }),
    [issueId]
  );

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`basis-1/3 shrink-0 p-1 ${selectedIssue === issueId && !isActive ? 'bg-blue-200' : backgroundColor} ${isAddIssue ? 'border-2 border-dashed shadow-none' : 'border-4 shadow hover:border-4 hover:border-blue-300 hover:shadow-none'} ${opacity}`}
      onClick={() => {
        if (!isAddIssue) {
          setIsSelected(!isSelected);
          if (issueId === selectedIssue) {
            // set default to this week's notes
            setSelectedIssue(null);
          } else {
            setSelectedIssue(issueId);
          }
        } else {
          setSelectedIssue(null);
        }
      }}
    >
      <div className={`w-full h-full`}>
        {/* Navigation to scratch space */}
        {isAddIssue ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex flex-col w-full h-full mx-auto my-auto items-center justify-center">
              <ContentEditable
                id={`title-${issueId}`}
                html={titleRef.current}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    // check if blank first
                    let input = titleRef.current;
                    if (input === '') {
                      return;
                    }

                    // add new issue and clear the text area
                    onAddIssue(input);
                    titleRef.current = '';
                  }

                  // set state holding issue to empty if enter was pressed, otherwise the current text
                  setNewIssue(titleRef.current);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  titleRef.current = htmlToText(e.target.value);
                }}
                className={`p-1 mr-2 w-full min-h-16 mb-2 break-words flex-none empty:before:content-['Describe_an_item_of_concern...'] empty:before:italic empty:before:text-slate-500 border text-xs font-normal rounded-lg`}
              />
              <h2 className="text-xs font-bold italic text-center items-center">
                {newIssue === ''
                  ? 'or drag onto this block'
                  : "hit 'Enter' to add new issue"}
              </h2>
            </div>
          </>
        ) : (
          <>
            {/* Issue title */}
            <div className="p-1 w-full flex flex-col">
              <ContentEditable
                id={`title-${issueId}`}
                html={titleRef.current}
                onChange={(e) => {
                  titleRef.current = e.target.value.trim();
                  onTitleEdit(
                    e.target.value.trim().replace(/<\/?[^>]+(>|$)/g, '')
                  );
                }}
                className={`p-0.5 mr-2 w-full min-h-16 mb-2 break-words flex-none empty:before:content-['Describe_concern_you_observed...'] empty:before:italic empty:before:text-slate-400 border text-xs font-normal rounded-lg`}
              />

              {/* TODO: 05-14-24 -- change this to show if practices are being tracked for the issue, rather than missing, since the top space can also be scratch */}
              <div className="flex flex-row items-center w-full">
                {/* Missing strategies */}
                {issue &&
                  !issue.plan.some((currPlan) => {
                    return currPlan.value.trim() !== '';
                  }) && (
                    <>
                      <ExclamationTriangleIcon className="h-5 mr-1 text-red-500" />
                      <div className="text-xs font-medium text-red-500">
                        Missing follow-up plan
                      </div>
                    </>
                  )}
                {!isThisWeek && (
                  <TrashIcon
                    className={`h-5 text-slate-600 ml-auto`}
                    onClick={() => {
                      onDeleteIssue();
                    }}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
