import mongoose from 'mongoose';

export interface EditLogStruct {
  date: Date;
  project: string;
  sig: string;
  objectEditedType: string;
  objectEdited: mongoose.Schema.Types.ObjectId;
  original: string;
  edits: string;
}

const EditLog = new mongoose.Schema<EditLogStruct>({
  date: {
    type: Date,
    required: true
  },
  project: {
    type: String,
    required: true
  },
  sig: {
    type: String,
    required: true
  },
  objectEditedType: {
    type: String,
    enum: ['CAPNote', 'IssueObject', 'PracticeGapObject'],
    default: 'CAPNote'
  },
  objectEdited: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  original: {
    type: String,
    required: true,
    default: ''
  },
  edits: {
    type: String,
    required: true
  }
});

export default (mongoose.models.EditLog as mongoose.Model<EditLogStruct>) ||
  mongoose.model('EditLog', EditLog);
