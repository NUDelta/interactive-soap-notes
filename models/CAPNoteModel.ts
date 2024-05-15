import mongoose, { Types } from 'mongoose';
import { TextEntrySchema, TextEntryStruct } from './TextEntryModel';

export interface CAPStruct {
  project: string;
  date: Date;
  lastUpdated: Date;
  sigName: string;
  sigAbbreviation: string;
  context: TextEntryStruct[];
  assessment: TextEntryStruct[];
  plan: TextEntryStruct[];
  pastIssues: Types.ObjectId[];
  currentIssues: Types.ObjectId[];
  trackedPractices: Types.ObjectId[];
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
  // TODO: CAP won't be used in the future, but keeping for now so I don't have to migrate
  context: [TextEntrySchema],
  assessment: [TextEntrySchema],
  plan: [TextEntrySchema],
  pastIssues: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IssueObject'
    }
  ],
  currentIssues: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IssueObject'
    }
  ],
  trackedPractices: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PracticeGapObject'
    }
  ]
});

export default (mongoose.models.CAPNote as mongoose.Model<CAPStruct>) ||
  mongoose.model('CAPNote', CAPNote);
