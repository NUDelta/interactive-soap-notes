import dbConnect from '../../lib/dbConnect';
import EditLogModel, { EditLogStruct } from '../../models/EditLogModel';

export const createEditLogEntry = async (editLog: object) => {
  // check that original and edits are different before saving
  if (editLog['original'] === editLog['edits']) {
    return null;
  }

  // save edits
  await dbConnect();
  let newEditLog = new EditLogModel(editLog);
  return await newEditLog.save();
};

export const createEditLogObject = (
  date: Date,
  project: string,
  sig: string,
  objectEditedType: string,
  objectEdited: string,
  original: object,
  edits: object
): EditLogStruct => {
  return {
    date,
    project,
    sig,
    objectEditedType,
    objectEdited,
    original: JSON.stringify(original),
    edits: JSON.stringify(edits)
  };
};
