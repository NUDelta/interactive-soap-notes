import mongoose from "mongoose";

// Mongoose model of a SOAP note, with four sections
// consider whether to add a SIG to a SOAP note later
// or should there be some kind of user model where the SIG
// information there is used to label the note?

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