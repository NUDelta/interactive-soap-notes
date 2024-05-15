/**
 * This component provides a note block component, which is the smallest unit of a note. Mentors use this component to write notes.
 */

import { useDrag } from 'react-dnd';
import { useState } from 'react';
import { DragTypes } from '../controllers/draggable/dragTypes';
import { htmlToText } from '../lib/helperFns';
import TextBox from './TextBox';

// TODO: add a note section and onDragToIssue function
export default function NoteBlockForPlan({
  noteSection,
  noteId,
  noteContent,
  onKeyDown,
  onKeyUp,
  onChange,
  onDragToIssue,
  editable = true
}): JSX.Element {
  // state variable to store the note content
  const [blockContent, setBlockContent] = useState(noteContent.value);

  // autocomplete options
  const studentNameSet = [
    'Maalvika',
    'Jason',
    'Arya',
    'Ella',
    'Billy',
    'Edward',
    'Shirley',
    'Jackie',
    'Grace',
    'Linh',
    'Kapil'
  ];

  let autoCompleteOptions = {
    // practice agent tags
    '[': ['plan', 'help', 'reflect', 'self-work'],
    // people
    'w[': studentNameSet,
    // working representations
    'rep[': [
      'canvas: problem statement',
      'canvas: design argument',
      'canvas: interface argument',
      'canvas: system argument',
      'canvas: user testing plan',
      'canvas: testing takeaways',
      'canvas: approach tree',
      'design: journey map',
      'design: storyboard',
      'planning: slicing',
      'planning: risk assessment',
      'write: __', // drafting a section
      'table: __',
      'diagram: __'
    ],
    'at[': ['mysore', 'pair research']
  };

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // define drag and drop functionality
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: DragTypes.NOTE_BLOCK,
      item: { noteId },
      end(item, monitor) {
        const dropResult = monitor.getDropResult();

        // see if the note was dropped into an issue
        if (item && dropResult) {
          const isDropAllowed =
            dropResult.allowedDropEffect === 'move' ||
            dropResult.allowedDropEffect === dropResult.dropEffect;

          // if drop was allowed, then move the note to the issue
          if (isDropAllowed) {
            console.log(
              `Note ${noteId} was dropped into issue ${dropResult.issue}. Moving "${noteContent.value}" to "${noteSection}" of issue ${dropResult.issue}`
            );

            onDragToIssue(dropResult.issue, noteSection, noteContent);
          }
        }
      },
      collect: (monitor) => ({
        opacity: monitor.isDragging() ? 'opacity-40' : 'opacity-100'
      })
    }),
    [noteId]
  );

  // TODO: notes should be draggable within and across the CAP sections
  return (
    <>
      <div
        ref={drag}
        className="border shadow flex flex-col items-left align-middle mb-2 w-full"
        key={`note-block-${noteId}`}
      >
        <div className="flex flex-row h-12">
          {/* drag handle on left side */}
          <div
            className={`flex items-center fill-slate-200 stroke-slate-200 ${opacity}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 stroke-slate-400"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="12" r="0.5"></circle>
              <circle cx="8" cy="5" r="0.5"></circle>
              <circle cx="8" cy="19" r="0.5"></circle>
              <circle cx="16" cy="12" r="0.5"></circle>
              <circle cx="16" cy="5" r="0.5"></circle>
              <circle cx="16" cy="19" r="0.5"></circle>
            </svg>
          </div>

          {/* editable content */}
          <div className="w-full">
            <TextBox
              value={blockContent}
              triggers={Object.keys(autoCompleteOptions)}
              options={autoCompleteOptions}
              spacer={'] '}
              onKeyUp={onKeyUp}
              onKeyDown={onKeyDown}
              onChange={(value) => {
                setBlockContent(value);
                onChange(value, htmlToText(value));
              }}
              className={`h-full px-1 py-1 border-none rounded-none leading-normal flex-initial basis-full text-xs text-wrap break-words placeholder:italic placeholder:text-slate-400`}
            />
          </div>
        </div>
      </div>
    </>
  );
}