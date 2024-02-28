import mongoose from 'mongoose';

export interface SOAPStruct {
  project: string;
  date: Date;
  lastUpdated: Date;
  sigName: string;
  sigAbbreviation: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  issues: IssueStruct[];
  priorContext: object;
  notedAssessments: object;
  followUpContext: object;
}

export interface IssueStruct {
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  summary: string;
  followUpPlans: ScriptObj[];
}

interface ScriptObj {
  venue: string;
  strategy: string;
}

const SOAPSchema = new mongoose.Schema<SOAPStruct>({
  project: {
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
  sigName: {
    type: String,
    required: true
  },
  sigAbbreviation: {
    type: String,
    required: true
  },
  subjective: { type: String, required: true },
  objective: { type: String, required: true },
  assessment: { type: String, required: true },
  plan: { type: String, required: true },
  issues: {
    type: [
      {
        title: String,
        subjective: String,
        objective: String,
        assessment: String,
        plan: String,
        summary: String,
        followUpPlans: [
          {
            venue: String,
            strategy: String
          }
        ]
      }
    ],
    required: true,
    default: []
  },
  priorContext: {
    type: Object,
    required: true
  },
  notedAssessments: {
    type: Object,
    required: true
  },
  followUpContext: {
    type: Object,
    required: true
  }
});

export default (mongoose.models.SOAPNote as mongoose.Model<SOAPStruct>) ||
  mongoose.model('SOAPNote', SOAPSchema);
