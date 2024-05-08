import mongoose from 'mongoose';

export interface EditLogStruct {
  date: Date;
  note: string;
  edits: string;
}

const EditLog = new mongoose.Schema<EditLogStruct>({
  date: {
    type: Date,
    required: true
  },
  note: {
    type: String,
    required: true
  },
  edits: {
    type: String,
    required: true
  }
});

export default (mongoose.models.EditLog as mongoose.Model<EditLogStruct>) ||
  mongoose.model('EditLog', EditLog);
