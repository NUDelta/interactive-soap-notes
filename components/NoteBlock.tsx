/**
 * This component provides a note block component, which is the smallest unit of a note. Mentors use this component to write notes.
 */

import { useDrag } from 'react-dnd';
import { useRef, useEffect, useState } from 'react';
import ContentEditable from 'react-contenteditable';
import { DragTypes } from '../controllers/draggable/dragTypes';
import { htmlToText } from '../lib/helperFns';

// TODO: add a note section and onDragToIssue function
export default function NoteBlock({
  noteSection,
  noteId,
  noteContent,
  onKeyDown,
  onKeyUp,
  onChange,
  onDragToIssue,
  editable = true
}): JSX.Element {
  // ref to the note block's content so state changes don't trigger a re-render
  const blockContent = useRef(noteContent.value);

  // state variable to store the student name set
  const [studentNameSet, setStudentNameSet] = useState(new Set());

  useEffect(() => {
    const fetchData = async () => {
      let peopleReq = await fetch(
        '/api/studio-api?' +
          new URLSearchParams({
            dataVal: 'people'
          })
      );
      const data = await peopleReq.json();

      // create a set of all the names
      let studentNameSet = new Set(
        data.data.map((person) => {
          if (person.name) {
            let name = person.name.split(' ')[0];
            return name.toLowerCase();
          }
          return '';
        })
      );

      // remove empty strings
      studentNameSet.delete('');

      // set the student name set
      setStudentNameSet(studentNameSet);
    };

    fetchData();
  }, []); // Empty dependency array ensures this runs only once on mount

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  const parsePracticeFollowup = (content) => {
    let output = {
      notificationsToStudents: null,
      followUpAtNextMeeting: null
    };

    // TODO: one way to parse might be to use rep/[------] or @------ or w/------
    // find what kinds of script it is
    let splitContent = null;
    let regexMatch = content.match(/\[(.*?)\]\s*(.*)/);
    if (regexMatch) {
      splitContent = regexMatch.slice(1);
    }

    // parse the content
    if (splitContent && splitContent.length === 2 && splitContent[1] !== '') {
      // create the message based on the script type
      let scriptType = splitContent[0];
      if (scriptType === 'plan') {
        output = {
          notificationsToStudents: `I'll link students to their sprint log and ask them to re-plan with your feedback. I'll also check tomorrow to see if they've done so, and if not ping their channel on Slack.`,
          followUpAtNextMeeting: null
        };
      } else if (scriptType === 'reflect') {
        output = {
          notificationsToStudents:
            "I'll share the reflection suggestions with students, and ask them to be mindful of them throughout the week.",
          followUpAtNextMeeting:
            "I'll ask students to reflect on how the week went with your prompts, and bring you their responses."
        };
      } else if (scriptType === 'help') {
        if (!splitContent[1].includes('@') && !splitContent[1].includes('w/')) {
          // case: general help request with no venue or people
          output = {
            notificationsToStudents:
              "I'll remind students about Mysore and Pair Research opportunities throughout the week.",
            followUpAtNextMeeting:
              "I'll ask students to share a deliverable outcome from the help opportunity, and how that changed their research understanding."
          };
        } else if (
          splitContent[1].includes('@') &&
          !splitContent[1].includes('w/')
        ) {
          // case: at a venue
          if (splitContent[1].toLowerCase().includes('mysore')) {
            output = {
              notificationsToStudents:
                "I'll remind students about Mysore for this practice.",
              followUpAtNextMeeting:
                "I'll ask students to share a deliverable outcome from Mysore, and how that changed their research understanding."
            };
          } else if (splitContent[1].toLowerCase().includes('pair')) {
            output = {
              notificationsToStudents:
                "I'll remind students about Pair Research for this practice.",
              followUpAtNextMeeting:
                "I'll share the student's Pair Research request and how it helped the students with their blockers."
            };
          }
        } else if (splitContent[1].includes('w/')) {
          // case: with a person
          let people = [];
          studentNameSet.forEach((name) => {
            if (splitContent[1].toLowerCase().includes(name)) {
              people.push(name);
            }
          });

          if (people.length >= 0) {
            output = {
              notificationsToStudents: `I'll setup a group DM with ${people.map((person) => capitalizeFirstLetter(person)).join(' and ')}, and suggest they work together on the practice.`,
              followUpAtNextMeeting: `I'll ask students to share a deliverable outcome from the help opportunity, and how that changed their research understanding.`
            };
          }
        }

        // check if a rep was given
        if (splitContent[1].includes('rep/')) {
          output = {
            notificationsToStudents: `${output.notificationsToStudents}. I'll suggest they use the representation above.`,
            followUpAtNextMeeting: output.followUpAtNextMeeting.replace(
              'deliverable outcome',
              'copy of the representation you suggested'
            )
          };
        }
      } else if (scriptType === 'self-work') {
        output = {
          notificationsToStudents:
            "I'll ask students to work on the practice you suggested.",
          followUpAtNextMeeting:
            "I'll ask students to share their deliverable, and a reflection on how it changed their understanding."
        };
      }
    }

    return output;
  };

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
        className="items-left mb-2 flex w-full flex-col border align-middle shadow"
        key={`note-block-${noteId}`}
      >
        <div className="flex flex-row">
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
          <ContentEditable
            id={noteId}
            html={blockContent.current}
            disabled={!editable}
            onChange={(e) => {
              // update ref with new content
              blockContent.current = e.target.value;

              // save note changes
              onChange(
                blockContent.current,
                htmlToText(blockContent.current).trim()
              );
            }}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            className={`flex-initial basis-full text-wrap break-words py-1 text-xs empty:before:italic empty:before:text-slate-400 empty:before:content-['Type_here...']`}
          />
        </div>
      </div>
    </>
  );
}
