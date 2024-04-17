/**
 * This component provides a note block component, which is the smallest unit of a note. Mentors use this component to write notes.
 */

import React, { useState, useEffect } from 'react';

export default function NoteBlock({
  noteId,
  noteContent,
  placeholder,
  onKeyDown,
  onKeyUp,
  onChange
}): JSX.Element {
  const placeholderFormatted = (
    placeholder ? placeholder : 'Type here...'
  ).replace(' ', '_');

  console.log(placeholderFormatted);

  return (
    <>
      <div className="border flex items-left align-middle mb-2">
        {/* drag handle on left side */}
        <div className="flex items-center fill-slate-200 stroke-slate-200 mr-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-slate-400 h-8"
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="5" r="1"></circle>
            <circle cx="12" cy="19" r="1"></circle>
            <circle cx="20" cy="12" r="1"></circle>
            <circle cx="20" cy="5" r="1"></circle>
            <circle cx="20" cy="19" r="1"></circle>
          </svg>
        </div>

        {/* editable content on right side */}
        <div
          contentEditable="true"
          suppressContentEditableWarning={true}
          className={`p-2 w-full before:content-['${placeholderFormatted}'] empty:before:italic empty:before:text-slate-400`}
          onKeyDown={(e) => {
            onKeyDown(e);
          }}
          onKeyUp={(e) => {
            onKeyUp(e);
          }}
          // TODO: this only handles when user unfocues on the line, not when the line is actively being edited
          onBlur={(e) => {
            onChange(e);
          }}
        >
          {noteContent.value}
        </div>
      </div>
    </>
  );
}
