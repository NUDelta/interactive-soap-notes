import mongoose from 'mongoose';

export interface ConceptualIssueStruct {
  title: string;
  description: string;
  currentInstance: IssueInstanceStruct;
  priorInstances: IssueInstanceStruct[];
  lastUpdated: Date; // indicator of when issue was last discussed
  issueInactive: boolean; // whether the issue has temporarily been resolved
  issueArchived: boolean; // whether issue should be permanently archived
}

export interface IssueInstanceStruct {
  date: Date;
  context: string;
  summary: string;
  plan: string;
  practices: PracticeStruct[];
}

export interface PracticeStruct {
  practice: string;
  opportunity: string;
  person: string;
  activeIssueId: string; // fetched from OS once an issue is saved
}

const PracticeSchema = new mongoose.Schema<PracticeStruct>({
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
  activeIssueId: {
    type: String,
    required: true,
    default: ''
  }
});

const IssueInstanceSchema = new mongoose.Schema<IssueInstanceStruct>({
  date: {
    type: Date,
    required: true
  },
  context: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    required: true,
    default: ''
  },
  practices: [PracticeSchema]
});

export const ConceptualIssueSchema = new mongoose.Schema<ConceptualIssueStruct>(
  {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    currentInstance: {
      type: IssueInstanceSchema,
      default: null
    },
    priorInstances: {
      type: [IssueInstanceSchema],
      default: []
    },
    lastUpdated: {
      type: Date,
      required: true
    },
    issueInactive: {
      type: Boolean,
      required: true,
      default: false
    },
    issueArchived: {
      type: Boolean,
      required: true,
      default: false
    }
  }
);
