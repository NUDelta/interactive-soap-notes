import dbConnect from '../../lib/dbConnect';
import { shortDate } from '../../lib/helperFns';
import CAPNoteModel from '../../models/CAPNoteModel';
import EditLog from '../../models/editLog';

export const updateCAPNote = async (id: string, capNote: object) => {
  let capNoteUpdatedContent = parseCAPNotes(capNote);

  await dbConnect();
  let updatedCAPNote = await CAPNoteModel.findByIdAndUpdate(
    id,
    capNoteUpdatedContent,
    {
      new: true,
      runValidators: true
    }
  );

  // add to the edit log
  let editLog = new EditLog({
    date: new Date(),
    note: `${updatedCAPNote.project} | ${shortDate(updatedCAPNote.date)}`,
    edits: JSON.stringify(capNote)
  });
  await editLog.save();

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
