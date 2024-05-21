import mongoose, { Types } from 'mongoose';
import { PracticeGapObjectStruct } from '../../models/PracticeGapObjectModel';

export const createNewPracticeGapObject = (
  title: string,
  project: string,
  sig: string,
  description: string,
  currentDate: string = new Date().toISOString(),
  priorIssues: Types.ObjectId[] = [],
  includeId: boolean = false
): PracticeGapObjectStruct => {
  let newPracticeGapObject: PracticeGapObjectStruct = {
    title: title,
    date: new Date(currentDate),
    project: project,
    sig: sig,
    description: description,
    lastUpdated: new Date(currentDate),
    practiceInactive: false,
    practiceArchived: false,
    prevIssues: priorIssues
  };

  if (includeId) {
    newPracticeGapObject.id = new mongoose.Types.ObjectId().toString();
  }

  return newPracticeGapObject;
};
