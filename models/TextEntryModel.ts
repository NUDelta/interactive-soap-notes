import mongoose from 'mongoose';

export interface TextEntryStruct {
  type: 'note' | 'script' | 'follow-up';
  context: ContextObj[];
  value: string;
}

interface ContextObj {
  description: string;
  value: string;
}

export const TextEntrySchema = new mongoose.Schema<TextEntryStruct>({
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
