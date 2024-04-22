import mongoose from 'mongoose';
import { IssueObjectStruct, IssueObjectSchema } from './IssueObjectModel';
import { TextEntryStruct, TextEntrySchema } from './TextEntryModel';

export interface PracticeObjectStruct {
  title: string;
  description: string;
  currentInstance: IssueObjectStruct;
  priorInstances: IssueObjectStruct[];
  lastUpdated: Date; // indicator of when practice was last discussed
  practiceInactive: boolean; // whether the practice has temporarily been resolved
  practiceArchived: boolean; // whether practice should be permanently archived
}

export const PracticeObjectSchema = new mongoose.Schema<PracticeObjectStruct>({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  currentInstance: {
    type: IssueObjectSchema,
    default: null
  },
  priorInstances: {
    type: [IssueObjectSchema],
    default: []
  },
  lastUpdated: {
    type: Date,
    required: true
  },
  practiceInactive: {
    type: Boolean,
    required: true,
    default: false
  },
  practiceArchived: {
    type: Boolean,
    required: true,
    default: false
  }
});
