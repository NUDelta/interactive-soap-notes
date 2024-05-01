import mongoose from 'mongoose';
import { TextEntrySchema, TextEntryStruct } from './TextEntryModel';
import {
  PracticeObjectSchema,
  PracticeObjectStruct
} from './PracticeObjectModel';
import { IssueObjectSchema, IssueObjectStruct } from './IssueObjectModel';

export interface CAPStruct {
  project: string;
  date: Date;
  lastUpdated: Date;
  sigName: string;
  sigAbbreviation: string;
  context: TextEntryStruct[];
  assessment: TextEntryStruct[];
  plan: TextEntryStruct[];
  pastIssues: IssueObjectStruct[];
  currentIssues: IssueObjectStruct[];
  trackedPractices: PracticeObjectStruct[];
}

const CAPNote = new mongoose.Schema<CAPStruct>({
  project: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  lastUpdated: {
    type: Date,
    required: true
  },
  sigName: {
    type: String,
    required: true
  },
  sigAbbreviation: {
    type: String,
    required: true
  },
  context: [TextEntrySchema],
  assessment: [TextEntrySchema],
  plan: [TextEntrySchema],
  pastIssues: [IssueObjectSchema],
  currentIssues: [IssueObjectSchema],
  trackedPractices: [PracticeObjectSchema]
});

export default (mongoose.models.CAPNote as mongoose.Model<CAPStruct>) ||
  mongoose.model('CAPNote', CAPNote);
