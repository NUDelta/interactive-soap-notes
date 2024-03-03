import mongoose from 'mongoose';
import { TextEntrySchema, TextEntryStruct } from './TextEntryModel';
import { ConceptualIssueSchema, ConceptualIssueStruct } from './IssueModel';

export interface SOAPStruct {
  project: string;
  date: Date;
  lastUpdated: Date;
  sigName: string;
  sigAbbreviation: string;
  subjective: TextEntryStruct[];
  objective: TextEntryStruct[];
  assessment: TextEntryStruct[];
  plan: TextEntryStruct[];
  issues: ConceptualIssueStruct[];
  // priorContext: object;
  // notedAssessments: object;
  // followUpContext: object;
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
  subjective: [TextEntrySchema],
  objective: [TextEntrySchema],
  assessment: [TextEntrySchema],
  plan: [TextEntrySchema],
  issues: [ConceptualIssueSchema]
  // priorContext: {
  //   type: Object,
  //   required: true
  // },
  // notedAssessments: {
  //   type: Object,
  //   required: true
  // },
  // followUpContext: {
  //   type: Object,
  //   required: true
  // }
});

export default (mongoose.models.SOAPNote as mongoose.Model<SOAPStruct>) ||
  mongoose.model('SOAPNote', SOAPSchema);
