import mongoose, { Types } from 'mongoose';
import { PracticeGapObjectStruct } from '../../models/PracticeGapObjectModel';

export const createNewPracticeGapObject = (
  title: string,
  project: string,
  sig: string,
  description: string,
  currentDate: Date = new Date(),
  priorIssues: Types.ObjectId[] = [],
  includeId: boolean = false
): PracticeGapObjectStruct => {
  let newPracticeGapObject: PracticeGapObjectStruct = {
    title: title,
    date: currentDate,
    project: project,
    sig: sig,
    description: description,
    lastUpdated: currentDate,
    practiceInactive: false,
    practiceArchived: false,
    prevIssues: priorIssues
  };

  if (includeId) {
    newPracticeGapObject.id = new mongoose.Types.ObjectId().toString();
  }

  return newPracticeGapObject;
};
