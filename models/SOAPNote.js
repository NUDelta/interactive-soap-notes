import mongoose, { Schema } from "mongoose";
const Section = require("./Section.js");

// Mongoose model of a SOAP note, with four sections
// consider whether to add a SIG to a SOAP note later
// or should there be some kind of user model where the SIG
// information there is used to label the note?

// NOTE: I had to comment out the "required" for both S and O

const SOAPNoteSchema = new mongoose.Schema({
    S: {
      /* Subjective section */
      type: Schema.Types.ObjectId, 
      ref: 'Section',
      default: {name: 'S', entries: 'Subjective content'},
      required: [true, "Subjective section cannot be empty"],
    },
      /* Objective section */
    O: {
      type: Schema.Types.ObjectId, 
      ref: 'Section',
      default: {name: 'O', entries: 'Objective content'},
      required: [true, "Objective section cannot be empty."],
    },
    /* Assessment section */
    A: {
      type: Schema.Types.ObjectId, 
      ref: 'Section',
      default: {name: 'A', entries: 'Assessment content'},
      required: [true, "Objective section cannot be empty."],
    },
    /* Plan section */
    P: {
        type: Schema.Types.ObjectId, 
        ref: 'Section',
        default: {name: 'P', entries: 'Plan content'},
        required: [true, "Objective section cannot be empty."],
      },
  });

  // const SOAPNote = SOAPNoteSchema.discriminator('section', Section)
  
  // export default SOAPNote

  export default mongoose.models.SOAPNote || mongoose.model("SOAPNote", SOAPNoteSchema);