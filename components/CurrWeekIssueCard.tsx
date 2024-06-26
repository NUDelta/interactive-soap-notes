/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import TrashIcon from '@heroicons/react/24/outline/TrashIcon';
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';
import ArrowUturnLeftIcon from '@heroicons/react/24/outline/ArrowUturnLeftIcon';

import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { DragTypes } from '../controllers/draggable/dragTypes';
import ContentEditable from 'react-contenteditable';
import { createNewIssueObject } from '../controllers/issueObjects/createIssueObject';
import {
  htmlToText,
  longDate,
  serializeDates,
  shortenText
} from '../lib/helperFns';

export default function CurrWeekIssueCard({
  project,
  sig,
  date,
  issueId,
  issue,
  selectedIssue,
  setSelectedIssue,
  currentIssuesData,
  setCurrentIssuesData,
  pastIssuesData,
  setPastIssuesData
}): JSX.Element {
  // onAddIssue is a function that adds a new issue to the current issues
  const onAddIssue = (newIssueTitle) => {
    let newIssueForWeek = serializeDates(
      createNewIssueObject(
        newIssueTitle,
        project,
        sig,
        new Date(date).toISOString(),
        [],
        true
      )
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
      issuesToUpdate[issueIndex].lastUpdated = new Date().toISOString();
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
      issuesToUpdate[issueIndex].lastUpdated = new Date().toISOString();
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
        ? [DragTypes.PAST_ISSUE] // [DragTypes.NOTE_BLOCK, DragTypes.PAST_ISSUE]
        : [DragTypes.PRACTICE], // [DragTypes.NOTE_BLOCK, DragTypes.PRACTICE],

      // info for target item the draggable element is trying to be added to
      drop: () => ({
        name: `${allowedDropEffect} to issue: ${title}`,
        allowedDropEffect,
        id: issueId,
        type: 'CurrentWeekIssueObject'
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
      item: { id: issueId, type: 'CurrentWeekIssueObject' },
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
      className={`shrink-0 basis-1/3 p-1 ${backgroundColor !== 'bg-transparent' ? backgroundColor : selectedIssue === issueId ? 'bg-blue-200' : 'bg-transparent'} ${isAddIssue ? 'border-2 border-dashed shadow-none' : 'border-4 shadow hover:border-4 hover:border-blue-300 hover:shadow-none'} ${opacity}`}
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
      <div className={`h-full w-full`}>
        {/* Navigation to scratch space */}
        {isAddIssue ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="mx-auto my-auto flex h-full w-full flex-col items-center justify-center p-2">
              <ContentEditable
                id={`title-${issueId}`}
                html={titleRef.current}
                onKeyUp={(e) => {
                  const issueTitle = htmlToText(titleRef.current).trim();
                  if (e.key === 'Enter') {
                    // check if blank first
                    let input = issueTitle;
                    if (input === '') {
                      return;
                    }

                    // add new issue and clear the text area
                    onAddIssue(input);
                    titleRef.current = '';
                  }

                  // set state holding issue to empty if enter was pressed, otherwise the current text
                  setNewIssue(issueTitle);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  titleRef.current = e.target.value;
                }}
                className={`mb-2 mr-2 min-h-16 w-full flex-none break-words rounded-lg border p-1 text-xs font-normal empty:before:italic empty:before:text-slate-500 empty:before:content-['Describe_an_item_of_concern...']`}
              />
              <h2 className="items-center text-center text-xs font-bold italic">
                {newIssue === ''
                  ? 'or drag onto this card'
                  : "hit 'Enter' to add new issue"}
              </h2>
            </div>
          </>
        ) : (
          <>
            {/* Issue title */}
            <div className="flex w-full flex-col">
              <ContentEditable
                id={`title-${issueId}`}
                html={titleRef.current}
                onChange={(e) => {
                  titleRef.current = e.target.value.trim();
                  onTitleEdit(htmlToText(e.target.value).trim());
                }}
                className={`mb-0.5 mr-2 min-h-16 w-full flex-none break-words rounded-lg border p-0.5 text-xs font-normal empty:before:italic empty:before:text-slate-400 empty:before:content-['Describe_concern_you_observed...']`}
              />

              <div className="flex w-full flex-col">
                {/* Show concern is linked from a past issue  */}
                {issue && issue.priorInstances.length > 0 && (
                  <div className="mb-0.5 flex flex-row items-center">
                    <ArrowUturnLeftIcon className="mr-1 h-4 text-blue-600" />
                    <div className="text-2xs font-medium text-blue-600">
                      Created from, &quot;
                      <span className="italic">
                        {shortenText(
                          pastIssuesData.find((pastIssue) => {
                            return pastIssue.id === issue.priorInstances[0];
                          }).title,
                          50
                        )}
                      </span>
                      &quot;
                    </div>
                  </div>
                )}

                {/* System is tracking practices */}
                {issue &&
                  issue.plan.some((currPlan) => {
                    return ['[plan]', '[self-work]', '[help]', '[reflect'].some(
                      (agent) => currPlan.value.trim().includes(agent)
                    );
                  }) && (
                    <div className="flex flex-row items-center">
                      <CheckBadgeIcon className="mr-1 h-4 text-green-600" />
                      <div className="text-2xs font-medium text-green-600">
                        Tracking follow-up plans
                      </div>
                    </div>
                  )}

                {/* Trash to remove concern */}
                {!isThisWeek && (
                  <TrashIcon
                    className={`ml-auto h-5 text-slate-600`}
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
