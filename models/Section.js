import mongoose from "mongoose";
//import { Snippet } from "./Snippet.js"

// a section (S, O, A, or P) of a SOAP note, named accordingly
// for now entries is just a single String, but it should be 
// changed to an array of snippets later

const SectionSchema = new mongoose.Schema({
    name: {
      /* S, O, A, or P (maybe something else later?) */
      type: String,
      enum: ['S', 'O', 'A', 'P'],
      required: [true, "Please label this section."],
    },
    entries: {
      /* Collection of note snippets for each section */
      type: String,
    },
  });
  
  export default mongoose.models.Section || mongoose.model("Section", SectionSchema);