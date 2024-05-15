import mongoose from 'mongoose';

export interface FollowUpObjectStruct {
  practice: string;
  parsedPractice: {
    // TODO: this may get changed
    practice: string;
    opportunity: string;
    person: string;
    reflectionQuestions: ReflectionQuestion[];
  };
  outcome: {
    didHappen: boolean;
    deliverableLink: string | null;
    deliverableNotes: string | null;
    reflection: [FollowUpReflection[], FollowUpReflection[]]; // false for didHappen corresponds to questions in to 0, true to 1
  };
}

interface ReflectionQuestion {
  prompt: string;
  responseType: string;
  forDidPractice: boolean;
}

interface FollowUpReflection {
  prompt: string;
  response: string;
}

const ReflectionQuestionSchema = new mongoose.Schema<ReflectionQuestion>({
  prompt: {
    type: String,
    required: true
  },
  responseType: {
    type: String,
    required: true
  },
  forDidPractice: {
    type: Boolean,
    required: true,
    default: true
  }
});

const FollowUpReflectionSchema = new mongoose.Schema<FollowUpReflection>({
  prompt: {
    type: String,
    required: true
  },
  response: {
    type: String,
    required: true
  }
});

const ParsedPracticeSchema = new mongoose.Schema({
  practice: {
    type: String,
    required: true
  },
  opportunity: {
    type: String,
    required: true
  },
  person: {
    type: String,
    required: true
  },
  reflectionQuestions: {
    type: [ReflectionQuestionSchema],
    required: true
  }
});

const PracticeOutcomeSchema = new mongoose.Schema({
  didHappen: {
    type: Boolean,
    required: true
  },
  deliverableLink: {
    type: String,
    required: false
  },
  deliverableNotes: {
    type: String,
    required: false
  },
  reflections: [
    {
      type: [FollowUpReflectionSchema],
      required: true
    },
    {
      type: [FollowUpReflectionSchema],
      required: true
    }
  ]
});

export const FollowUpObjectSchema = new mongoose.Schema({
  practice: {
    type: String,
    required: true
  },
  parsedPractice: {
    type: ParsedPracticeSchema,
    required: true
  },
  outcome: {
    type: PracticeOutcomeSchema,
    required: true
  }
});
