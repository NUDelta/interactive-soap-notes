import dbConnect from '../../lib/dbConnect';
import CAPNoteModel, { CAPStruct } from '../../models/CAPNoteModel';

export const updateCAPNote = async (id: string, capNote: object) => {
  let capNoteUpdatedContent = parseCAPNotes(capNote);

  await dbConnect();
  return await CAPNoteModel.findByIdAndUpdate(id, capNoteUpdatedContent, {
    new: true,
    runValidators: true
  });
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
    trackedPractices: capNote['trackedPractices'],
    currIssueInstances: capNote['currIssueInstances']
  };
};
