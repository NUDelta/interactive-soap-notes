import dbConnect from '../../lib/dbConnect';
import { shortDate } from '../../lib/helperFns';
import CAPNoteModel from '../../models/CAPNoteModel';
import EditLogModel from '../../models/EditLogModel';

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
  let newEditLog = new EditLogModel({
    date: new Date(),
    note: `${updatedCAPNote.project} | ${shortDate(updatedCAPNote.date)}`,
    edits: JSON.stringify(capNote)
  });
  await newEditLog.save();

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
