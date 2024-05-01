/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';

import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';

export default function IssueCard({
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
      className={`flex flex-wrap border-4 p-1 ${selectedIssue === issueId && !isActive ? 'bg-blue-200' : backgroundColor} ${isAddPractice ? 'border-dashed' : 'border hover:bg-blue-100'} ${opacity}`}
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
        {/* Adding Practice */}
        {isAddPractice ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex flex-col w-full h-full mx-auto my-auto items-center justify-center">
              <textarea
                className="w-full h-3/4 text-base"
                placeholder="Enter a new issue as, 'We are trying to do X, but Y is preventing progress,' and hit enter..."
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
              <h2 className="text-base font-bold items-center">
                <span className="text-sm text-center italic">
                  {newIssue.trim() === ''
                    ? 'or drag a note onto this block'
                    : "hit 'Enter' to add new issue"}
                </span>
              </h2>
            </div>
          </>
        ) : (
          <>
            {/* Issue title */}
            <div className="p-2 mb-1 w-full flex flex-col">
              <div className="w-11/12 flex flex-row">
                <ContentEditable
                  id={`title-${issueId}`}
                  html={titleRef.current}
                  onChange={(e) => {
                    titleRef.current = e.target.value;
                    onTitleEdit(
                      e.target.value.trim().replace(/<\/?[^>]+(>|$)/g, '')
                    );
                  }}
                  className={`p-0.5 mr-2 flex-none w-full empty:before:content-['Title_of_practice_gap...'] empty:before:italic empty:before:text-slate-400 border text-base font-bold rounded-lg`}
                />
                <div>
                  {!isThisWeek && (
                    <TrashIcon
                      className={`h-8 text-slate-600`}
                      onClick={() => {
                        onDeleteIssue(issueId);
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Last update */}
              <div className="text-xs">
                <h3 className="mt-1 font-medium">Updated: {lastUpdated}</h3>
              </div>

              {/* Missing strategies */}
              <div className="text-xs">
                {issue &&
                  !issue.plan.some((currPlan) => {
                    return currPlan.value.trim() !== '';
                  }) && (
                    <h3 className="mt-2 font-medium text-red-500 flex flex-row items-center">
                      <ExclamationTriangleIcon className="h-6 mr-1" />
                      Missing strategies
                    </h3>
                  )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
