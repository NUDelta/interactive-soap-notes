import mongoose from 'mongoose';
import { IssueObjectStruct } from '../../models/IssueObjectModel';
import { createNewTextEntryBlock } from '../textEntryBlock/createNewTextEntryBlock';

/**
 * Creates a new JavaScript object for an issue
 */
export const createNewIssueObject = (
  title: string,
  project: string,
  sig: string,
  currentDate: string = new Date().toISOString(),
  priorInstances: string[] = [],
  includeId: boolean = false
): IssueObjectStruct => {
  // TODO: create new CAP placeholder fields
  let newIssueObject: IssueObjectStruct = {
    title: title,
    date: new Date(currentDate),
    project: project,
    sig: sig,
    lastUpdated: new Date(),
    wasDeleted: false,
    wasMerged: false,
    mergeTarget: null,
    context: [createNewTextEntryBlock()],
    assessment: [createNewTextEntryBlock()],
    plan: [createNewTextEntryBlock()],
    followUps: [],
    priorInstances: priorInstances
  };

  if (includeId) {
    newIssueObject.id = new mongoose.Types.ObjectId().toString();
  }
  return newIssueObject;
};
