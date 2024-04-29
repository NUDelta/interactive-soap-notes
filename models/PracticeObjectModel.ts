import mongoose from 'mongoose';
import { IssueObjectStruct, IssueObjectSchema } from './IssueObjectModel';

export interface PracticeObjectStruct {
  title: string;
  description: string;
  createdAt: Date;
  lastUpdated: Date;
  practiceInactive: boolean; // whether the practice has temporarily been resolved
  practiceArchived: boolean; // whether practice should be permanently archived
  prevIssues: IssueObjectStruct[];
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
  createdAt: {
    type: Date,
    required: true
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
  },
  prevIssues: {
    type: [IssueObjectSchema],
    required: true
  }
});
