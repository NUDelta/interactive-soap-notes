import mongoose from 'mongoose';

export interface SOAP {
  project: string;
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

// TODO: make the SOAP strings required, but allow 0-length strings (https://stackoverflow.com/questions/44320745/in-mongoose-how-do-i-require-a-string-field-to-not-be-null-or-undefined-permitt)
const SOAPSchema = new mongoose.Schema<SOAP>({
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
  subjective: {
    type: String,
    required: true
  },
  objective: {
    type: String,
    required: true
  },
  assessment: {
    type: String,
    required: true
  },
  plan: {
    type: String,
    required: true
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

export default (mongoose.models.SOAPNote as mongoose.Model<SOAP>) ||
  mongoose.model('SOAPNote', SOAPSchema);
