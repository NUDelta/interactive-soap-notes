/**
 * This component provides an issue card that summarizes the issue, when it was last updated, and the follow-up plans.
 */

import ExclamationTriangleIcon from '@heroicons/react/24/outline/ExclamationTriangleIcon';
import React, { useState, useEffect } from 'react';

export default function IssueCard({
  issueId,
  title,
  lastUpdated,
  followUpPlans,
  selectedIssue,
  setSelectedIssue
}): JSX.Element {
  // store selected state for card
  const [isSelected, setIsSelected] = useState(false);

  return (
    <div
      className={`w-3/12 mb-1 p-1 ${selectedIssue === issueId ? 'bg-blue-100' : 'bg-white'}`}
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
            className={`flex flex-wrap text-md text-orange-500 py-1 ${followUpPlans.length > 0 ? '' : 'opacity-0'}`}
          >
            <ExclamationTriangleIcon className="h-4" />
            <span className="text-s font-bold mt-2">
              Issue does not have any follow-up plans written or actionable
              check-ins encoded
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
