// general imports
import type { GetServerSideProps } from 'next';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import mongoose, { set } from 'mongoose';
import { mutate } from 'swr';

// helper components
import { Tooltip } from 'flowbite-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// utilities
import {
  longDate,
  serializeDates,
  shortDate,
  shortenText
} from '../../lib/helperFns';

// data models and controllers
import { fetchCAPNote } from '../../controllers/capNotes/fetchCAPNotes';
import { fetchIssueObjectsByIds } from '../../controllers/issueObjects/fetchIssueObject';
import { fetchProjectGapObjectsByIds } from '../../controllers/practiceGapObjects/fetchPracticeGapObject';
import { createNewTextEntryBlock } from '../../controllers/textEntryBlock/createNewTextEntryBlock';

// components
import LastWeekIssueCard from '../../components/LastWeekIssueCard';
import LastWeekIssuePane from '../../components/LastWeekIssuePane';
import CurrWeekIssueCard from '../../components/CurrWeekIssueCard';
import CurrWeekIssuePane from '../../components/CurrWeekIssuePane';
import PracticeGapCard from '../../components/PracticeGapCard';

// icons
import ArrowPathIcon from '@heroicons/react/24/outline/ArrowPathIcon';
import CheckCircleIcon from '@heroicons/react/24/outline/CheckCircleIcon';
import ExclamationCircleIcon from '@heroicons/react/24/outline/ExclamationCircleIcon';

export default function CAPNote({
  capNoteInfo,
  lastWeekIssues,
  currentWeekIssues,
  practiceGaps
}): JSX.Element {
  // have state for cap note data
  const [noteInfo, setNoteInfo] = useState(capNoteInfo);
  const [lastUpdated, setLastUpdated] = useState(capNoteInfo.lastUpdated);

  // hold data state for issues and practices
  // see here for updating arrays in state variables: https://react.dev/learn/updating-arrays-in-state#updating-objects-inside-arrays
  const [pastIssuesData, setPastIssuesData] = useState(lastWeekIssues);
  const [currentIssuesData, setCurrentIssuesData] = useState(currentWeekIssues);
  const [practiceGapData, setPracticeGapData] = useState(practiceGaps);

  // hold a state for which issue is selected
  const [selectedIssue, setSelectedIssue] = useState(null);

  // hold a state for showing / hiding practice gap details
  const [showPracticeGaps, setShowPracticeGaps] = useState(false);

  // let user know that we are saving and if there were any errors
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // hold a ref that checks if first load
  const firstLoad = useRef(true);

  // on first load, set the dates for noteInfo to be localized to the timezone
  useEffect(() => {
    setNoteInfo((prevNoteInfo) => ({
      ...prevNoteInfo,
      sigDate: shortDate(new Date(prevNoteInfo.sigDate)),
      lastUpdated: longDate(new Date(prevNoteInfo.lastUpdated))
    }));

    setLastUpdated(longDate(new Date(noteInfo.lastUpdated)));
  }, []);

  // listen for changes in pastIssue, currentIssue, or practiceGaps states and do debounced saves to database
  useEffect(() => {
    // don't save on first load
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }

    setIsSaving(true);
    const timeOutId = setTimeout(async () => {
      /**
       * Start by saving the issues
       */
      // create a list of objects to save
      let pastIssuesToSave = pastIssuesData.map((issue) => {
        return structuredClone({
          id: issue.id,
          title: issue.title,
          date: new Date(issue.date).toISOString(),
          project: issue.project,
          sig: issue.sig,
          lastUpdated: new Date(issue.lastUpdated).toISOString(),
          wasDeleted: issue.wasDeleted,
          wasMerged: issue.wasMerged,
          mergeTarget: issue.mergeTarget,
          context: issue.context,
          assessment: issue.assessment,
          plan: issue.plan,
          followUps: issue.followUps,
          priorInstances: issue.priorInstances
        });
      });

      let currentIssuesToSave = currentIssuesData.map((issue) => {
        return structuredClone({
          id: issue.id,
          title: issue.title,
          date: new Date(issue.date).toISOString(),
          project: issue.project,
          sig: issue.sig,
          lastUpdated: new Date(issue.lastUpdated).toISOString(),
          wasDeleted: issue.wasDeleted,
          wasMerged: issue.wasMerged,
          mergeTarget: issue.mergeTarget,
          context: issue.context,
          assessment: issue.assessment,
          plan: issue.plan,
          followUps: issue.followUps,
          priorInstances: issue.priorInstances
        });
      });

      // make request to save the data to the database
      let noteInfoWithUtc = {
        ...noteInfo,
        sigDate: new Date(noteInfo.sigDate).toISOString(),
        lastUpdated: new Date(noteInfo.lastUpdated).toISOString()
      };
      try {
        // make one request to save the past issues
        const pastIssueRes = await fetch(`/api/issues/`, {
          method: 'POST',
          body: JSON.stringify({
            data: [...pastIssuesToSave],
            updateType: 'past',
            noteInfo: noteInfoWithUtc
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const pastIssueOutput = await pastIssueRes.json();

        // if there's an error, throw an exception
        if (!pastIssueRes.ok) {
          throw new Error(
            `Error from server when saving PastIssues: ${pastIssueOutput.error}`
          );
        }

        // otherwise, update the local data without a revalidation
        if (pastIssueOutput.data !== null) {
          mutate(`/api/issues/`, pastIssueOutput.data, false);
        }

        // make another request to save the current issues
        const currentIssueRes = await fetch(`/api/issues/`, {
          method: 'POST',
          body: JSON.stringify({
            data: [...currentIssuesToSave],
            updateType: 'current',
            noteInfo: noteInfoWithUtc
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const currentIssueOutput = await currentIssueRes.json();

        // if there's an error, throw an exception
        if (!currentIssueRes.ok) {
          throw new Error(
            `Error from server when saving CurrentIssues: ${currentIssueOutput.error}`
          );
        }

        // otherwise, update the local data without a revalidation
        if (currentIssueOutput.data !== null) {
          mutate(`/api/issues/`, currentIssueOutput.data, false);
        }

        /**
         * Now save the practice gaps
         */
        let practiceGapsToSave = practiceGapData.map((practiceGap) => {
          return structuredClone({
            id: practiceGap.id,
            title: practiceGap.title,
            date: new Date(practiceGap.date).toISOString(),
            project: practiceGap.project,
            sig: practiceGap.sig,
            description: practiceGap.description,
            lastUpdated: practiceGap.lastUpdated,
            practiceInactive: practiceGap.practiceInactive,
            practiceArchived: practiceGap.practiceArchived,
            prevIssues: practiceGap.prevIssues.map((issue) => issue.id)
          });
        });

        // make request to save the data to the database
        const practiceGapRes = await fetch(`/api/practice-gaps/`, {
          method: 'POST',
          body: JSON.stringify({
            data: [...practiceGapsToSave]
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const practiceGapOutput = await practiceGapRes.json();

        // if there's an error, throw an exception
        if (!practiceGapRes.ok) {
          throw new Error(
            `Error from server when saving PracticeGaps: ${practiceGapOutput.error}`
          );
        }

        // otherwise, update the local data without a revalidation
        if (practiceGapOutput.data !== null) {
          mutate(`/api/practice-gaps/`, practiceGapOutput.data, false);
        }

        /**
         * Finally, update and save noteInfo
         */
        // hold a last updated timestamp
        const lastUpdated = new Date().toISOString();

        // create a clone of the data to save
        let dataToSave = structuredClone({
          project: noteInfo.project,
          date: new Date(noteInfo.sigDate).toISOString(),
          lastUpdated: lastUpdated,
          sigName: noteInfo.sigName,
          sigAbbreviation: noteInfo.sigAbbreviation,
          context: noteInfo.context ?? [],
          assessment: noteInfo.assessment ?? [],
          plan: noteInfo.plan ?? [],
          pastIssues: pastIssueOutput.data.map((issue) => issue._id),
          currentIssues: currentIssueOutput.data.map((issue) => issue._id),
          trackedPractices: practiceGapOutput.data.map(
            (practice) => practice._id
          )
        });

        // make request to save the data to the database
        const capNoteInfoRes = await fetch(`/api/soap/${noteInfo.id}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        const capNoteInfoOutput = await capNoteInfoRes.json();

        // if there's an error, throw an exception
        if (!capNoteInfoRes.ok) {
          throw new Error(
            `Error from server when saving CAPNote: ${capNoteInfoOutput.error}`
          );
        }

        // otherwise, update the local data without a revalidation
        if (capNoteInfoOutput.data !== null) {
          mutate(`/api/soap/${noteInfo.id}`, capNoteInfoOutput.data, false);
        }

        // update the last updated timestamp for the note
        setLastUpdated(longDate(new Date(lastUpdated), true));

        // update the state variable for noteInfo
        setNoteInfo((prevNoteInfo) => ({
          ...prevNoteInfo,
          pastIssues: pastIssueOutput.data.map((issue) => issue._id),
          currentIssues: currentIssueOutput.data.map((issue) => issue._id),
          trackedPractices: practiceGapOutput.data.map(
            (practice) => practice._id
          )
        }));

        // if there's no error, clear the error state
        setSaveError(null);
      } catch (err) {
        // if there's an error, set the error state
        console.error('Error in saving data: ', err);
        setSaveError(err.message);
      }

      // saving is completed
      setIsSaving(false);
    }, 1000);

    return () => clearTimeout(timeOutId);
  }, [pastIssuesData, currentIssuesData, practiceGapData]);

  // return the page
  return (
    <>
      {/* Set title of the page to be project name */}
      <Head>
        <title>
          {`${shortenText(
            noteInfo.project,
            15
          )} | ${new Date(noteInfo.sigDate).toLocaleString().split(',')[0]}`}
        </title>
      </Head>

      {/* Header info for CAP note */}
      <div className="mx-auto mt-2 w-full pl-3 pr-3">
        {/* Back, title, and last updated */}
        <div className="flex flex-row flex-nowrap items-center">
          {/* Back button */}
          <div className="mr-1">
            <Link href="/">
              <Tooltip content="Back to all notes" placement="bottom">
                <h3 className="text-base font-bold text-blue-400 visited:text-purple-600 hover:text-blue-500">
                  &#8592;
                </h3>
              </Tooltip>
            </Link>
          </div>

          {/* Title */}
          <div className="mr-2">
            <h1 className="text-base font-bold">
              {noteInfo.project} | {noteInfo.sigDate}
            </h1>
          </div>

          {/* Save status */}
          {/* Three states of saved: (1) saved without error; (2) saving; (3) save attemped but error */}
          <div className="flex flex-row items-center">
            {/* Saved successfully */}
            {!isSaving && saveError === null ? (
              <>
                <CheckCircleIcon className="mr-0.5 h-5 w-5 text-green-600" />
                <h2 className="text-base font-semibold text-green-600">
                  Notes last saved on {lastUpdated}
                </h2>
              </>
            ) : (
              <></>
            )}

            {/* Saving */}
            {isSaving ? (
              <>
                <ArrowPathIcon className="mr-0.5 h-5 w-5 animate-spin text-blue-600" />
                <h2 className="text-base font-semibold text-blue-600">
                  Saving...
                </h2>
              </>
            ) : (
              <></>
            )}

            {/* Save attempted but error */}
            {!isSaving && saveError !== null ? (
              <>
                <Tooltip content={saveError} placement="bottom">
                  <ExclamationCircleIcon className="mr-0.5 h-5 w-5 text-red-600" />
                </Tooltip>
                <h2 className="text-base font-semibold text-red-600">
                  Error in saving notes (Last saved: {lastUpdated})
                </h2>
              </>
            ) : (
              <></>
            )}
          </div>
          <div></div>
        </div>

        <DndProvider backend={HTML5Backend}>
          {/* Past issues and tracked practices fixed to top of page */}
          {/* TODO: 05-06-24: maybe add a hide and show button so mentor can recover vertical space when done browsing past issues */}
          <div className="fixed w-full">
            <div className="mr-6 flex flex-row">
              {/* All Issues */}
              <div className="mb-5 h-[25vh] w-full">
                {/* Section title and description */}
                <div className="flex flex-col">
                  <h1 className="border-b border-black text-base font-bold">
                    Items of Concern
                  </h1>
                  <div className="h-[20vh] overflow-y-auto">
                    <p className="mb-2 text-xs italic">
                      Note any items of concern here (e.g., project issues,
                      practice gaps, developing competencies). Click on items
                      tracked from SIG to view follow-up outcomes. Click on
                      current week items to edit it&apos;s CAP notes. Create new
                      items by typing on the last card, or by dragging a prior
                      week card on it.
                      {/* Cards from this week can be dragged on top of each other to merge them, or into the CAP notes for a selected issue. */}
                    </p>

                    {/* Issues */}
                    <div className="grid grid-cols-6 gap-2">
                      {/* Last Week Issues */}
                      {pastIssuesData.map((lastWeekIssue) => (
                        <LastWeekIssueCard
                          key={`issue-card-${lastWeekIssue.id}`}
                          issueId={lastWeekIssue.id}
                          title={lastWeekIssue.title}
                          date={new Date(lastWeekIssue.date).toISOString()}
                          noteDate={new Date(noteInfo.sigDate).toISOString()}
                          selectedIssue={selectedIssue}
                          setSelectedIssue={setSelectedIssue}
                          pastIssuesData={pastIssuesData}
                          setPastIssuesData={setPastIssuesData}
                          currentIssuesData={currentIssuesData}
                          setCurrentIssuesData={setCurrentIssuesData}
                        />
                      ))}

                      {/* Archived Issues */}
                      {currentIssuesData
                        .filter((currIssue) => {
                          return currIssue.wasDeleted || currIssue.wasMerged;
                        })
                        .map((currIssue) => (
                          <CurrWeekIssueCard
                            key={`issue-card-${currIssue.id}`}
                            project={noteInfo.project}
                            sig={noteInfo.sigName}
                            date={new Date(noteInfo.sigDate).toISOString()}
                            issueId={currIssue.id}
                            issue={currIssue}
                            selectedIssue={selectedIssue}
                            setSelectedIssue={setSelectedIssue}
                            currentIssuesData={currentIssuesData}
                            setCurrentIssuesData={setCurrentIssuesData}
                            pastIssuesData={pastIssuesData}
                            setPastIssuesData={setPastIssuesData}
                          />
                        ))}

                      {/* Current Issues */}
                      {currentIssuesData
                        .filter((currIssue) => {
                          return !(currIssue.wasDeleted || currIssue.wasMerged);
                        })
                        .map((currIssue) => (
                          <CurrWeekIssueCard
                            key={`issue-card-${currIssue.id}`}
                            project={noteInfo.project}
                            sig={noteInfo.sigName}
                            date={new Date(noteInfo.sigDate).toISOString()}
                            issueId={currIssue.id}
                            issue={currIssue}
                            selectedIssue={selectedIssue}
                            setSelectedIssue={setSelectedIssue}
                            currentIssuesData={currentIssuesData}
                            setCurrentIssuesData={setCurrentIssuesData}
                            pastIssuesData={pastIssuesData}
                            setPastIssuesData={setPastIssuesData}
                          />
                        ))}

                      {/* Create a new issue for the week */}
                      <CurrWeekIssueCard
                        key="issue-card-add-issue"
                        project={noteInfo.project}
                        sig={noteInfo.sigName}
                        date={new Date(noteInfo.sigDate).toISOString()}
                        issueId="add-issue"
                        issue={null}
                        selectedIssue={selectedIssue}
                        setSelectedIssue={setSelectedIssue}
                        currentIssuesData={currentIssuesData}
                        setCurrentIssuesData={setCurrentIssuesData}
                        pastIssuesData={pastIssuesData}
                        setPastIssuesData={setPastIssuesData}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Placeholder div to push down the non-fixed portion */}
          <div className="h-[26vh]" />

          {/* Note Space */}
          <div>
            {/* if no issue is selected */}
            {selectedIssue === null && (
              <div>
                <h1 className="sticky top-0 mb-1 border-b border-black bg-white text-base font-bold italic">
                  Select an issue from above to view or edit notes. Tracked gaps
                  in students self-regulation skills are shown below, for
                  reference.
                </h1>

                <div className="h-[66vh] w-full overflow-auto">
                  {/* Practice Cards */}
                  <div className="mb-3">
                    {/* Active Practices */}
                    <div className="grid grid-cols-3 gap-2 overflow-auto">
                      {practiceGapData
                        .filter((practiceGap) => {
                          return (
                            !practiceGap.practiceInactive &&
                            !practiceGap.practiceArchived
                          );
                        })
                        .map((practiceGap) => (
                          <PracticeGapCard
                            key={`issue-card-${practiceGap.id}`}
                            project={noteInfo.project}
                            sig={noteInfo.sigName}
                            date={new Date(noteInfo.sigDate).toISOString()}
                            practiceGapId={practiceGap.id}
                            practiceGap={practiceGap}
                            practiceGapsData={practiceGapData}
                            setPracticeGapsData={setPracticeGapData}
                            showPracticeGaps={'Show Gaps with Details'}
                            setShowPracticeGaps={setShowPracticeGaps}
                            currentIssuesData={currentIssuesData}
                            setCurrentIssuesData={setCurrentIssuesData}
                          />
                        ))}

                      {/* practice card for new practice gaps */}
                      <PracticeGapCard
                        key="issue-card-add-practice"
                        project={noteInfo.project}
                        sig={noteInfo.sigName}
                        date={new Date(noteInfo.sigDate).toISOString()}
                        practiceGapId="add-practice"
                        practiceGap={null}
                        practiceGapsData={practiceGapData}
                        setPracticeGapsData={setPracticeGapData}
                        showPracticeGaps={'Show Gaps with Details'}
                        setShowPracticeGaps={setShowPracticeGaps}
                        currentIssuesData={currentIssuesData}
                        setCurrentIssuesData={setCurrentIssuesData}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* if a current week issue is selected */}
            {selectedIssue !== null &&
              currentIssuesData.findIndex(
                (issue) => issue.id === selectedIssue
              ) !== -1 && (
                <>
                  <h1 className="sticky top-0 mb-1 border-b border-black bg-white text-base font-bold">
                    {currentIssuesData.findIndex(
                      (practice) => practice.id === selectedIssue
                    ) !== -1 &&
                      currentIssuesData[
                        currentIssuesData.findIndex(
                          (practice) => practice.id === selectedIssue
                        )
                      ].title}
                  </h1>
                  <div className="h-[66vh] w-full overflow-auto">
                    <p className="text-xs italic">
                      Write notes about selected issue below. Context and
                      Assessment notes are private to you.{' '}
                      <span className="font-semibold">
                        The Title above and Plan notes will be shared with
                        students.
                      </span>
                    </p>

                    <p className="mb-2 text-xs italic text-slate-500">
                      Press Shift-Enter to add a new text block and
                      Shift-Backspace to delete current block. Press Tab to move
                      to next block, and Shift-Tab to move to previous block.
                    </p>

                    <div className="w-full">
                      <CurrWeekIssuePane
                        key={`issue-pane-${selectedIssue}`}
                        issueId={selectedIssue}
                        project={noteInfo.project}
                        sig={noteInfo.sigName}
                        date={new Date(noteInfo.sigDate).toISOString()}
                        currentIssuesData={currentIssuesData}
                        setCurrentIssuesData={setCurrentIssuesData}
                        practiceGapData={practiceGapData}
                        setPracticeGapData={setPracticeGapData}
                      />
                    </div>
                  </div>
                </>
              )}

            {/* if a last week issue is selected */}
            {selectedIssue !== null &&
              pastIssuesData.findIndex(
                (issue) => issue.id === selectedIssue
              ) !== -1 && ( // Selected issue is a last week issue
                <>
                  <h1 className="sticky top-0 mb-1 border-b border-black bg-white text-base font-bold">
                    {pastIssuesData.findIndex(
                      (issue) => issue.id === selectedIssue
                    ) !== -1 &&
                      pastIssuesData[
                        pastIssuesData.findIndex(
                          (practice) => practice.id === selectedIssue
                        )
                      ].title}
                  </h1>

                  <div className="h-[66vh] w-full overflow-auto">
                    <LastWeekIssuePane
                      issueId={selectedIssue}
                      noteInfo={noteInfo}
                      currentIssuesData={currentIssuesData}
                      setCurrentIssuesData={setCurrentIssuesData}
                      pastIssuesData={pastIssuesData}
                      setPastIssuesData={setPastIssuesData}
                      practiceGapData={practiceGapData}
                      setPracticeGapData={setPracticeGapData}
                    />
                  </div>
                </>
              )}
          </div>
        </DndProvider>
      </div>
    </>
  );
}

// use serverside rendering to generate this page
export const getServerSideProps: GetServerSideProps = async (query) => {
  // helper function to convert mongo ids to strings
  const mongoIdFlattener = {
    transform: function (doc, ret) {
      ret.id = ret._id.toString();
      delete ret._id;
    }
  };

  // helper function to add a placeholder line if there is no data
  const addPlaceholderLine = (object) => {
    const placeholderLine = {
      id: new mongoose.Types.ObjectId().toString(),
      ...createNewTextEntryBlock()
    };

    return {
      ...object,
      context: object.context.length === 0 ? [placeholderLine] : object.context,
      assessment:
        object.assessment.length === 0 ? [placeholderLine] : object.assessment,
      plan: object.plan.length === 0 ? [placeholderLine] : object.plan
    };
  };

  // get the sig name and date from the query
  let [sigAbbrev, project, date] = (query.params?.id as string).split('_');

  /**
   *
   * fetch CAP note for the given sig and date, and format for display
   */
  // TODO: see how I can add type checking to this
  let currentCAPNote = await fetchCAPNote(sigAbbrev, project, date);
  let currentCAPNoteFlattened = serializeDates(
    currentCAPNote.toJSON(mongoIdFlattener)
  );

  // get the issues for the current note
  let pastIssues = await fetchIssueObjectsByIds(
    currentCAPNote.pastIssues.map((issue) => issue._id)
  );
  let pastIssuesFlattened = pastIssues.map((issue) => {
    let flattenedData = serializeDates(issue.toJSON(mongoIdFlattener));
    flattenedData.priorInstances = issue.priorInstances.map((instance) => {
      return instance.toString();
    });
    return flattenedData;
  });

  let currentIssues = await fetchIssueObjectsByIds(
    currentCAPNote.currentIssues.map((issue) => issue._id)
  );
  let currentIssuesFlattened = currentIssues.map((issue) => {
    let flattenedData = addPlaceholderLine(
      serializeDates(issue.toJSON(mongoIdFlattener))
    );
    flattenedData.priorInstances = issue.priorInstances.map((instance) => {
      return instance.toString();
    });
    return flattenedData;
  });

  // get tracked practice for the current note
  let trackedPractices = await fetchProjectGapObjectsByIds(
    currentCAPNote.trackedPractices.map((practice) => practice._id)
  );
  let trackedPracticesFlattened = trackedPractices.map((practice) => {
    return serializeDates(practice.toJSON(mongoIdFlattener));
  });

  // fetch issues for prevIssues linked to practices
  for (const trackedPractice of trackedPracticesFlattened) {
    trackedPractice.prevIssues = (
      await fetchIssueObjectsByIds(
        trackedPractice.prevIssues.map((issue) => issue._id)
      )
    ).map((issue) => {
      let flattenedData = serializeDates(issue.toJSON(mongoIdFlattener));
      flattenedData.priorInstances = issue.priorInstances.map((instance) => {
        return instance.toString();
      });
      return flattenedData;
    });
  }

  // create data object for display
  const capNoteInfo = {
    id: currentCAPNoteFlattened.id,
    project: currentCAPNoteFlattened.project,
    sigName: currentCAPNoteFlattened.sigName,
    sigAbbreviation: currentCAPNoteFlattened.sigAbbreviation,
    sigDate: currentCAPNoteFlattened.date,
    lastUpdated: currentCAPNoteFlattened.lastUpdated,
    context: currentCAPNoteFlattened.context,
    assessment: currentCAPNoteFlattened.assessment,
    plan: currentCAPNoteFlattened.plan,
    pastIssues: currentCAPNoteFlattened.pastIssues.map((issue) => {
      return issue.toString();
    }),
    currentIssues: currentCAPNoteFlattened.currentIssues.map((issue) => {
      return issue.toString();
    }),
    trackedPractices: currentCAPNoteFlattened.trackedPractices.map(
      (practice) => {
        return practice.toString();
      }
    )
  };

  /**
   * fetch contextual data from OS
   */
  let contextualData;
  try {
    const res = await fetch(
      `${process.env.ORCH_ENGINE}/organizationalObjects/getComputedOrganizationalObjectsForProject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectName: currentCAPNote.project })
      }
    );

    contextualData = await res.json();
  } catch (err) {
    console.error(err);
  }
  // setup tracked data
  let sprintStories;
  try {
    sprintStories = contextualData.project.tools.sprintLog.stories.map(
      (story) => {
        return `- ${story.description}`;
      }
    );
  } catch (err) {
    sprintStories = ['unable to fetch sprint stories'];
  }

  let sprintPoints;
  try {
    sprintPoints = contextualData.project.tools.sprintLog.points.map(
      (pointsForPerson) => {
        return `- ${pointsForPerson.name}: ${pointsForPerson.pointsCommitted.total} points out of ${pointsForPerson.pointsAvailable} committed; ${pointsForPerson.hoursSpent.total} hours spent`;
      }
    );
  } catch (err) {
    sprintPoints = ['unable to fetch sprint points'];
  }

  // /**
  //  * get active issues from OS
  //  * TODO: if using these, make them create cards that can be removed
  //  */
  // let activeIssues;
  // try {
  //   const res = await fetch(
  //     `${
  //       process.env.ORCH_ENGINE
  //     }/activeIssues/fetchActiveIssuesForProject?${new URLSearchParams({
  //       projectName: currentCAPNote.project
  //     })}`
  //   );
  //   activeIssues = await res.json();
  // } catch (err) {
  //   console.error(err);
  // }

  // // TODO: 03-03-24 -- see if I can filter out actionable followups and get some context separately
  // // get only issues and follow-ups for next SIG
  // const triggeredScripts = activeIssues
  //   .filter(
  //     (issue) =>
  //       !issue.name.includes('actionable follow-up') ||
  //       (issue.name.includes('actionable follow-up') &&
  //         (issue.name.includes('morning of next SIG') ||
  //           issue.name.includes('at next SIG')))
  //   )
  //   .map((script) => {
  //     return {
  //       name: script.name,
  //       type: script.name.includes('follow-up') ? 'follow-up' : 'issue',
  //       strategies: script.computed_strategies[0].outlet_args.message
  //     };
  //   });

  // // add active issues to SOAP notes
  // for (let script of triggeredScripts) {
  //   let scriptType = '';
  //   switch (script.type) {
  //     case 'follow-up':
  //       scriptType = 'follow-up';
  //       break;
  //     case 'practice':
  //       scriptType = 'practice';
  //       break;
  //     case 'issue':
  //     default:
  //       scriptType = 'detected issue';
  //   }
  //   let title =
  //     scriptType == 'follow-up'
  //       ? `[${scriptType}] ${script.strategies}`
  //       : `[${scriptType}] ${script.name} - ${script.strategies}`;
  //   let titleIndex = capNoteInfo.context.findIndex(
  //     (line) => line.value === title
  //   );

  //   if (titleIndex === -1) {
  //     capNoteInfo.context.push({
  //       id: new mongoose.Types.ObjectId().toString(),
  //       type: 'script',
  //       context: [],
  //       value: title
  //     });
  //   }
  // }

  // // sort context notes by [detected issues] first
  // capNoteInfo.context.sort((a, b) => {
  //   if (a.type === 'script' && b.type !== 'script') {
  //     return -1;
  //   } else {
  //     return 1;
  //   }
  // });

  // setup the page with the data from the database
  const lastWeekIssues = pastIssuesFlattened;
  const currentWeekIssues = currentIssuesFlattened;
  const practiceGaps = trackedPracticesFlattened;

  // print before returning if in development
  const env = process.env.NODE_ENV;
  if (env == 'development') {
    console.log('capNoteInfo', JSON.stringify(capNoteInfo, null, 2));
    console.log('lastWeekIssues', JSON.stringify(lastWeekIssues, null, 2));
    console.log(
      'currentWeekIssues',
      JSON.stringify(currentWeekIssues, null, 2)
    );
    console.log('practiceGaps', JSON.stringify(practiceGaps, null, 2));
  }

  return {
    props: {
      capNoteInfo: capNoteInfo,
      lastWeekIssues,
      currentWeekIssues,
      practiceGaps
    }
  };
};
