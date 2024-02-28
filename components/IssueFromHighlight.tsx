import React, { useState, useEffect } from 'react';
export default function IssueFromHighlight({
  visibility,
  section,
  highlightedContent,
  onClick
}): JSX.Element {
  return (
    <div
      className={`w-30 bg-white ${visibility === 'visible' ? '' : 'opacity-0'}`}
    >
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold px-4 h-8 rounded-full mr-3"
        onClick={(e) => onClick(section, highlightedContent)}
      >
        Add Issue from Highlighted Text
      </button>
    </div>
  );
}
