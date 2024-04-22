import mongoose from 'mongoose';

export interface FollowUpObjectStruct {
  practice: string;
  parsedPractice: {
    // TODO: this may get changed
    practice: string;
    opportunity: string;
    person: string;
    reflectionQuestions: string[];
  };
  outcome: {
    didHappen: boolean;
    deliverableLink: string | null;
    reflection: string;
  };
}

export const FollowUpObjectSchema = new mongoose.Schema<FollowUpObjectStruct>({
  practice: {
    type: String,
    required: true
  },
  parsedPractice: {
    type: {
      practice: String,
      opportunity: String,
      person: String,
      reflectionQuestions: [String]
    },
    required: true
  },
  outcome: {
    type: {
      didHappen: Boolean,
      deliverableLink: String,
      reflection: String
    }
  }
});
