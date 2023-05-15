import mongoose from 'mongoose';

export interface SOAP {
  date: Date;
  lastUpdated: Date;
  sigName: string;
  sigAbbreviation: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  priorContext: object;
  notedAssessments: object;
  followUpContext: object;
}

const SOAPSchema = new mongoose.Schema<SOAP>({
  date: {
    type: Date,
    required: true,
  },
  lastUpdated: {
    type: Date,
    required: true,
  },
  sigName: {
    type: String,
    required: true,
  },
  sigAbbreviation: {
    type: String,
    required: true,
  },
  subjective: {
    type: String,
    required: true,
  },
  objective: {
    type: String,
    required: true,
  },
  assessment: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    required: true,
  },
  priorContext: {
    type: Object,
    required: true,
  },
  notedAssessments: {
    type: Object,
    required: true,
  },
  followUpContext: {
    type: Object,
    required: true,
  },
});

export default (mongoose.models.SOAPNote as mongoose.Model<SOAP>) ||
  mongoose.model('SOAPNote', SOAPSchema);
