import mongoose from 'mongoose';

export interface TextEntryStruct {
  type: 'note' | 'script' | 'follow-up';
  context: ContextObj[];
  value: string;
}

interface ContextObj {
  contextType: [
    'issue' | 'practice' | 'follow-up' | 'note' | 'script' | 'other'
  ];
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
        contextType: {
          type: String,
          enum: ['issue', 'practice', 'follow-up', 'note', 'script', 'other'],
          default: 'other'
        },
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
