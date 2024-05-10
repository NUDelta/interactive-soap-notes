/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';

export default function CurrWeekIssueCard({
  issueId,
  issue,
  selectedIssue,
  setSelectedIssue,
  onAddIssue = undefined,
  onDeleteIssue,
  editable = true,
  onTitleEdit
}): JSX.Element {
  // init variables for the view
  const title = issue === null ? '' : issue.title;
  const lastUpdated = issue === null ? '' : issue.lastUpdated;

  // special cases for this week's notes and add practice
  const isThisWeek = issueId === 'this-weeks-notes';
  const isAddPractice = issueId === 'add-practice';

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
      accept: isAddPractice
        ? [DragTypes.NOTE_BLOCK, DragTypes.PAST_ISSUE]
        : editable
          ? [DragTypes.NOTE_BLOCK, DragTypes.PRACTICE]
          : [],

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
      type: isThisWeek || isAddPractice ? '' : DragTypes.CURRENT_ISSUE,
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
      className={`basis-1/3 shrink-0 border shadow p-1 ${selectedIssue === issueId && !isActive ? 'bg-blue-200' : backgroundColor} ${isAddPractice ? 'border-2 border-dashed shadow-none' : 'hover:bg-blue-100'} ${opacity}`}
      onClick={() => {
        if (!isAddPractice && !isThisWeek) {
          setIsSelected(!isSelected);
          if (issueId === selectedIssue) {
            // set default to this week's notes
            setSelectedIssue('this-weeks-notes');
          } else {
            setSelectedIssue(issueId);
          }
        } else if (isThisWeek) {
          setSelectedIssue('this-weeks-notes');
        }
      }}
    >
      <div className={`w-full h-full`}>
        {/* Navigation to scratch space */}
        {isThisWeek ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex flex-col w-3/4 h-full mx-auto my-auto items-center justify-center">
              <p className="text-sm font-semibold text-center italic">
                Scratch space for this week&apos;s notes
              </p>
            </div>
          </>
        ) : isAddPractice ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex flex-col w-full h-full mx-auto my-auto items-center justify-center">
              {/* TODO: switch this to a contenteditable div so it can auto resize */}
              <textarea
                className="w-full h-3/4 text-xs flex-none"
                placeholder="Type a new issue here..."
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    // check if blank first
                    let input = e.target.value.trim();
                    if (input === '') {
                      return;
                    }

                    // add new practice
                    onAddIssue(input);

                    // clear the textarea
                    e.target.value = '';
                  }

                  setNewIssue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
              ></textarea>
              <h2 className="text-xs font-bold italic text-center items-center">
                {newIssue.trim() === ''
                  ? 'or drag a note onto this block'
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
                className={`p-0.5 mr-2 w-full min-h-16 mb-2 break-words flex-none empty:before:content-['Title_of_practice_gap...'] empty:before:italic empty:before:text-slate-400 border text-xs font-normal rounded-lg`}
              />

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
                      onDeleteIssue(issueId);
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
