/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */

import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import React, { useState, useEffect } from 'react';

export default function IssueCard({
  issueId,
  title,
  lastUpdated,
  currentIssueInstance,
  selectedIssue,
  setSelectedIssue
}): JSX.Element {
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div
      className={`w-3/12 mb-1 p-1 hover:bg-blue-100 ${selectedIssue === issueId ? 'bg-blue-200' : 'bg-white'}`}
      onClick={() => {
        setIsSelected(!isSelected);
        if (issueId === selectedIssue) {
          setSelectedIssue(null);
        } else {
          setSelectedIssue(issueId);
        }
      }}
    >
      <div className="aspect-square border p-2">
        {/* Issue title */}
        <div className="grid grid-cols-1 mb-1 w-full">
          <h2 className="text-md font-bold">{title}</h2>
          <h3 className="text-xs font-bold mt-1">
            Last updated: {lastUpdated}
          </h3>

          <div
            className={`flex flex-wrap text-md text-orange-500 py-1 ${currentIssueInstance !== null && currentIssueInstance.plan.trim().length === 0 ? '' : 'opacity-0'}`}
          >
            <span className="inline-flex items-baseline text-s">
              <ExclamationTriangleIcon className="h-3" />
              &nbsp; Missing practices
            </span>
          </div>

          {/* TODO: add trash can and resolved button */}
        </div>
      </div>
    </div>
  );
}
