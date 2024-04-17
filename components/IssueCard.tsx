/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import ArchiveBoxIcon from '@heroicons/react/24/outline/ArchiveBoxIcon';
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';
import LockOpenIcon from '@heroicons/react/24/outline/LockOpenIcon';

import React, { useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';

export default function IssueCard({
  issueId,
  title,
  description,
  lastUpdated,
  selectedIssue,
  setSelectedIssue,
  currInstance,
  issueIsResolved,
  onResolved,
  onArchive
}): JSX.Element {
  // special cases for this week's notes and add issue
  const isThisWeek = issueId === 'this-weeks-notes';
  const isAddIssue = issueId === 'add-issue';

  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

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
  const allowedDropEffect = isThisWeek ? null : 'move';
  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      // what kinds of draggable items can be accepted into the issue
      accept: 'NOTE_BLOCK',

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

  return (
    <div
      ref={drop}
      className={`flex flex-wrap aspect-square border-4 ${selectedIssue === issueId && !isActive ? 'bg-blue-200' : backgroundColor} ${isAddIssue ? 'border-dashed' : 'border hover:bg-blue-100'}`}
    >
      <div
        className={`h-full`}
        onClick={() => {
          if (!isAddIssue) {
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
        {isAddIssue ? (
          <>
            {/* Large plus icon in center of square */}
            <div className="p-2 flex h-full w-full items-center">
              <h2 className="text-base font-bold flex-auto">
                Hover note block over tile to create new tracked practice
              </h2>
            </div>
          </>
        ) : (
          <>
            {/* Issue title */}
            <div className="p-2 mb-1 w-full">
              <div className="flex">
                <h2 className="text-base font-bold flex-auto">{title}</h2>
              </div>

              <div className="text-xs">
                <h3 className="mt-1 font-medium">Updated: {lastUpdated}</h3>
              </div>

              {/* Issue description */}
              <div className="mt-1">
                {description.trim() === '' ? (
                  <p className="text-base italic">No description available</p>
                ) : (
                  <p className="text-base">{description}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Resolve and archive buttons */}
        {!isThisWeek && !isAddIssue ? (
          <div className="w-full flex flex-row mt-auto">
            {!issueIsResolved ? (
              <>
                <div>
                  <CheckBadgeIcon
                    onClick={(e) => onResolved(e)}
                    className="ml-2 h-8 text-gray-600 hover:text-green-600"
                  />
                </div>
                <div>
                  <ArchiveBoxIcon
                    onClick={(e) => onArchive(e)}
                    className="ml-2 h-8 text-gray-600 hover:text-red-600"
                  />
                </div>
              </>
            ) : (
              <div>
                <LockOpenIcon
                  onClick={(e) => onResolved(e)}
                  className="ml-2 h-8 text-gray-600"
                />
              </div>
            )}
            <div className="">
              <ExclamationTriangleIcon
                className={`ml-2 h-8 text-orange-600 ${currInstance !== null && currInstance.plan.trim().length === 0 ? '' : 'opacity-0'}`}
              />
            </div>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
