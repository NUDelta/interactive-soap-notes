import dbConnect from '../../lib/dbConnect';
import CAPNoteModel from '../../models/CAPNoteModel';
import {
  createEditLogEntry,
  createEditLogObject
} from '../editLog/createEditLogEntry';

export const updateCAPNote = async (id: string, capNote: object) => {
  let capNoteUpdatedContent = parseCAPNotes(capNote);

  // get the original CAP note
  await dbConnect();
  let originalCAPNote = await CAPNoteModel.findById(id);
  let updatedCAPNote = await CAPNoteModel.findByIdAndUpdate(
    id,
    capNoteUpdatedContent,
    {
      new: true,
      runValidators: true
    }
  );

  // add to the edit log
  let newEditLogObject;
  if (originalCAPNote === null) {
    newEditLogObject = createEditLogObject(
      updatedCAPNote.lastUpdated,
      updatedCAPNote.project,
      updatedCAPNote.sigName,
      'CAPNote',
      id,
      originalCAPNote,
      updatedCAPNote
    );
  } else {
    newEditLogObject = createEditLogObject(
      updatedCAPNote.lastUpdated,
      updatedCAPNote.project,
      updatedCAPNote.sigName,
      'CAPNote',
      id,
      originalCAPNote,
      updatedCAPNote
    );
  }

  await createEditLogEntry(newEditLogObject);

  return updatedCAPNote;
};

// TODO: 04-23-24 this should call some code to create FollowUpObjects
const parseCAPNotes = (capNote: object) => {
  // create a new CAP note object to hold everything
  return {
    project: capNote['project'],
    date: capNote['date'],
    lastUpdated: capNote['lastUpdated'],
    sigName: capNote['sigName'],
    sigAbbreviation: capNote['sigAbbreviation'],
    context: capNote['context'],
    assessment: capNote['assessment'],
    plan: capNote['plan'],
    pastIssues: capNote['pastIssues'],
    currentIssues: capNote['currentIssues'],
    trackedPractices: capNote['trackedPractices']
  };
};
