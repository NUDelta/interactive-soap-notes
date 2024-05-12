import mongoose from 'mongoose';
import { TextEntrySchema, TextEntryStruct } from './TextEntryModel';
import {
  FollowUpObjectStruct,
  FollowUpObjectSchema
} from './FollowUpObjectModel';

export interface IssueObjectStruct {
  title: string;
  date: Date;
  project: string;
  sig: string;
  lastUpdated: Date;
  isDeleted: boolean;
  context: TextEntryStruct[];
  assessment: TextEntryStruct[];
  plan: TextEntryStruct[];
  followUps: FollowUpObjectStruct[];
  priorInstances: IssueObjectStruct[];
}

export const IssueObjectSchema = new mongoose.Schema<IssueObjectStruct>({
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
  lastUpdated: {
    type: Date,
    required: true
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false
  },
  context: {
    type: [TextEntrySchema],
    required: true
  },
  assessment: {
    type: [TextEntrySchema],
    required: true
  },
  plan: {
    type: [TextEntrySchema],
    required: true
  },
  followUps: [FollowUpObjectSchema],
  priorInstances: {
    type: [mongoose.Types.ObjectId],
    default: []
  }
});

export default (mongoose.models
  .IssueObject as mongoose.Model<IssueObjectStruct>) ||
  mongoose.model('IssueObject', IssueObjectSchema);
