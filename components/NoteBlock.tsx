/**
 * This component provides a note block component, which is the smallest unit of a note. Mentors use this component to write notes.
 */

import { useDrag } from 'react-dnd';
import { useRef } from 'react';
import ContentEditable from 'react-contenteditable';

// TODO: add a note section and onDragToIssue function
export default function NoteBlock({
  noteSection,
  noteId,
  noteContent,
  onKeyDown,
  onKeyUp,
  onChange,
  onDragToIssue
}): JSX.Element {
  // ref to the note block's content so state changes don't trigger a re-render
  const blockContent = useRef(noteContent.value);

  // define drag and drop functionality
  const [{ opacity }, drag] = useDrag(
    () => ({
      type: 'NOTE_BLOCK',
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

  console.log('dragging');

  // TODO: notes should be draggable within and across the CAP sections
  return (
    <>
      <div ref={drag} className="border flex items-left align-middle mb-2">
        {/* drag handle on left side */}
        <div
          className={`flex items-center fill-slate-200 stroke-slate-200 mr-1 ${opacity}`}
        >
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

        {/* editable content */}
        <ContentEditable
          id={noteId}
          html={blockContent.current}
          onChange={(e) => {
            // update ref with new content
            blockContent.current = e.target.value;

            // save note changes
            onChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          className={`p-2 w-full empty:before:content-['Type_here...'] empty:before:italic empty:before:text-slate-400`}
        />
      </div>
    </>
  );
}
