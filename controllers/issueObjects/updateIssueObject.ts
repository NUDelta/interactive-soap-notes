import dbConnect from '../../lib/dbConnect';
import IssueObjectModel from '../../models/IssueObjectModel';
import {
  createEditLogEntry,
  createEditLogObject
} from '../editLog/createEditLogEntry';

export const updateIssueObject = async (issueObject: object) => {
  await dbConnect();
  let issueObjectId = issueObject['id'];
  let originalIssueObject = await IssueObjectModel.findById(issueObjectId);
  let updatedIssueObject = await IssueObjectModel.findByIdAndUpdate(
    issueObjectId,
    issueObject,
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
