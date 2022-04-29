import mongoose from "mongoose";

// should this have an owner and SIG?
const SOAPNoteSchema = new mongoose.Schema({
    S: {
      /* Subjective section */
  
      type: {type: mongoose.Schema.Types.ObjectId, ref: 'Section'},
      required: [true, "Subjective section cannot be empty."],
    },
    O: {
        /* Objective section */
        type: {type: mongoose.Schema.Types.ObjectId, ref: 'Section'},
        required: [true, "Objective section cannot be empty."],
    },
    A: {
        /* Assessment section */
        type: {type: mongoose.Schema.Types.ObjectId, ref: 'Section'},
      },
    P: {
        /* Hashtag(s) associated with a snippet */
        type: {type: mongoose.Schema.Types.ObjectId, ref: 'Section'},
      },
  });
  
  export default mongoose.models.SOAPNoteSchema || mongoose.model("SOAPNote", SOAPNoteSchema);