import mongoose from 'mongoose';

export interface TextEntryStruct {
  isChecked: boolean;
  isInIssue: boolean;
  type: 'note' | 'script';
  context: ContextObj[];
  value: string;
}

interface ContextObj {
  description: string;
  value: string;
}

export const TextEntrySchema = new mongoose.Schema<TextEntryStruct>({
  isChecked: {
    type: Boolean,
    required: true
  },
  isInIssue: {
    type: Boolean,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  context: {
    type: [
      {
        description: String,
        value: String
      }
    ],
    required: true
  },
  value: {
    type: String,
    required: true
  }
});
