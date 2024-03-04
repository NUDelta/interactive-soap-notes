/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */
import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import ArchiveBoxIcon from '@heroicons/react/24/outline/ArchiveBoxIcon';
import CheckBadgeIcon from '@heroicons/react/24/outline/CheckBadgeIcon';
import LockOpenIcon from '@heroicons/react/24/outline/LockOpenIcon';

import React, { useState, useEffect } from 'react';

export default function IssueCard({
  issueId,
  title,
  description,
  lastUpdated,
  selectedIssue,
  setSelectedIssue,
  issueIsResolved,
  onResolved,
  onArchive
}): JSX.Element {
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div className="flex flex-wrap aspect-square border p-1">
      <div
        className={`p-2 hover:bg-blue-100 ${selectedIssue === issueId ? 'bg-blue-200' : 'bg-white'}`}
        onClick={() => {
          setIsSelected(!isSelected);
          if (issueId === selectedIssue) {
            setSelectedIssue(null);
          } else {
            setSelectedIssue(issueId);
          }
        }}
      >
        {/* Issue title */}
        <div className="mb-1 w-full">
          <div className="flex">
            <h2 className="text-base font-bold flex-auto">{title}</h2>
            <ExclamationTriangleIcon className="ml-2 h-6 text-orange-600 justify-end"></ExclamationTriangleIcon>
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
      </div>

      {/* Resolve and archive buttons */}
      <div className="flex justify-end place-items-end">
        {!issueIsResolved ? (
          <>
            <CheckBadgeIcon
              onClick={(e) => onResolved(e)}
              className="ml-2 h-8 text-gray-600 hover:text-green-600"
            ></CheckBadgeIcon>
            <ArchiveBoxIcon
              onClick={(e) => onArchive(e)}
              className="ml-2 h-8 text-gray-600 hover:text-red-600"
            ></ArchiveBoxIcon>
          </>
        ) : (
          <LockOpenIcon
            onClick={(e) => onResolved(e)}
            className="ml-2 h-8 text-gray-600"
          ></LockOpenIcon>
        )}
      </div>
    </div>
  );
}
