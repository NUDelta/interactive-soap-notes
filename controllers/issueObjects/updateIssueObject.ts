import mongoose from 'mongoose';
import dbConnect from '../../lib/dbConnect';
import IssueObjectModel from '../../models/IssueObjectModel';
import {
  createEditLogEntry,
  createEditLogObject
} from '../editLog/createEditLogEntry';

export const updateIssueObject = async (issueObject: object) => {
  // remove any CAP notes that are blank before saving
  let newIssueObject = { ...issueObject };
  newIssueObject['context'] = newIssueObject['context'].filter(
    (entry) => entry.value.trim() !== ''
  );
  newIssueObject['assessment'] = newIssueObject['assessment'].filter(
    (entry) => entry.value.trim() !== ''
  );
  newIssueObject['plan'] = newIssueObject['plan'].filter(
    (entry) => entry.value.trim() !== ''
  );

  await dbConnect();
  let issueObjectId = newIssueObject['id'];

  // check if issueObjectId is null or undefined
  if (issueObjectId === null || issueObjectId === undefined) {
    issueObjectId = new mongoose.Types.ObjectId().toString();
  }
  let originalIssueObject = await IssueObjectModel.findById(issueObjectId);
  let updatedIssueObject = await IssueObjectModel.findByIdAndUpdate(
    issueObjectId,
    newIssueObject,
    {
      runValidators: true,
      new: true,
      upsert: true // create a document if it doesn't exist
    }
  );

  // add to the edit log
  let newEditLogObject;
  if (originalIssueObject === null) {
    // case: no original issue object
    newEditLogObject = createEditLogObject(
      updatedIssueObject.lastUpdated,
      updatedIssueObject.project,
      updatedIssueObject.sig,
      'IssueObject',
      issueObjectId,
      {},
      updatedIssueObject
    );
  } else {
    // case: original issue object exists
    newEditLogObject = createEditLogObject(
      updatedIssueObject.lastUpdated,
      updatedIssueObject.project,
      updatedIssueObject.sig,
      'IssueObject',
      issueObjectId,
      originalIssueObject,
      updatedIssueObject
    );
  }

  await createEditLogEntry(newEditLogObject);
  return updatedIssueObject;
};
