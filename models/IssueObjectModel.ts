import mongoose from 'mongoose';
import { TextEntrySchema, TextEntryStruct } from './TextEntryModel';
import {
  FollowUpObjectStruct,
  FollowUpObjectSchema
} from './FollowUpObjectModel';

export interface IssueObjectStruct {
  title: string;
  date: Date;
  lastUpdated: Date;
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
  lastUpdated: {
    type: Date,
    required: true
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
