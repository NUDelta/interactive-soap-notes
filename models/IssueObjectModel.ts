import mongoose from 'mongoose';
import { TextEntrySchema, TextEntryStruct } from './TextEntryModel';
import {
  FollowUpObjectStruct,
  FollowUpObjectSchema
} from './FollowUpObjectModel';

export interface IssueObjectStruct {
  date: Date;
  context: TextEntryStruct[];
  assessment: TextEntryStruct[];
  plan: TextEntryStruct[];
  followUps: FollowUpObjectStruct[];
}

export const IssueObjectSchema = new mongoose.Schema<IssueObjectStruct>({
  date: {
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
  followUps: [FollowUpObjectSchema]
});
