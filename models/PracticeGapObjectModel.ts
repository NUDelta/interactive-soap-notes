import mongoose, { Types } from 'mongoose';

export interface PracticeGapObjectStruct {
  title: string;
  date: Date;
  project: string;
  sig: string;
  description: string;
  lastUpdated: Date;
  practiceInactive: boolean; // whether the practice has temporarily been resolved
  practiceArchived: boolean; // whether practice should be permanently archived
  prevIssues: Types.ObjectId[]; // issues that have this practice gap
}

export const PracticeGapObjectSchema =
  new mongoose.Schema<PracticeGapObjectStruct>({
    title: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    project: {
      type: String,
      required: true
    },
    sig: {
      type: String,
      required: true
    },
    description: {
      type: String,
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
    prevIssues: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'IssueObject'
      }
    ]
  });

export default (mongoose.models
  .PracticeGapObject as mongoose.Model<PracticeGapObjectStruct>) ||
  mongoose.model('PracticeGapObject', PracticeGapObjectSchema);
