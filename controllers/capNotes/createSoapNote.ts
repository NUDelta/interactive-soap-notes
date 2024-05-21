import mongoose from 'mongoose';
import dbConnect from '../../lib/dbConnect';
import CAPNoteModel from '../../models/CAPNoteModel';
import IssueObjectModel from '../../models/IssueObjectModel';
import { createNewTextEntryBlock } from '../textEntryBlock/createNewTextEntryBlock';

/**
 * Create a new CAP note given the project and date of the note.
 * @param projectName
 * @param noteDate
 */
export const createCAPNote = async (projectName: string, noteDate: Date) => {
  try {
    // get proj and sig info
    const projInfoRes = await fetch(
      `${process.env.STUDIO_API}/projects/byName?${new URLSearchParams({
        populateTools: 'false',
        projectName: projectName
      })}`
    );
    let projInfo = await projInfoRes.json();

    const socialStructuresRes = await fetch(
      `${process.env.STUDIO_API}/socialStructures`
    );
    let socialStructuresInfo = await socialStructuresRes.json();

    // parse out sigName and sigAbbreviation
    let sigName = projInfo.sig_name;
    let sigAbbreviation = socialStructuresInfo.find(
      (socialStructure) =>
        socialStructure.name === sigName &&
        socialStructure.kind === 'SigStructure'
    ).abbreviation;

    // get the previous CAP note for the project
    await dbConnect();
    const previousCAPNotes = await CAPNoteModel.find({
      project: projectName,
      sigName: sigName
    }).sort({ date: -1 });
    const previousCAPNote = previousCAPNotes[0];

    // get the currentIssues from the prior CAP note, which will become the pastIssues for the new note
    let pastIssues = [];
    let trackedPractices = [];
    if (previousCAPNote) {
      // fetch all IssueObjects for pastIssues so we only keep the ones that weren't deleted
      const pastIssueIds = previousCAPNote?.pastIssues;
      const issueObjects = await IssueObjectModel.find({
        _id: { $in: pastIssueIds }
      });
      pastIssues = issueObjects
        .filter((issue) => !issue.wasDeleted)
        .map((issue) => issue._id);

      // keep all tracked practices
      trackedPractices = previousCAPNote.trackedPractices;
    }

    // save the new SOAP note to the database
    await dbConnect();
    return await CAPNoteModel.create({
      project: projectName,
      date: noteDate,
      lastUpdated: noteDate,
      sigName: sigName,
      sigAbbreviation: sigAbbreviation,
      context: [createNewTextEntryBlock()],
      assessment: [createNewTextEntryBlock()],
      plan: [createNewTextEntryBlock()],
      pastIssues: pastIssues,
      currentIssues: [],
      trackedPractices: trackedPractices
    });
  } catch (err) {
    console.error('Error in creating CAP note: ', err, err.stack);
    return null;
  }
};
