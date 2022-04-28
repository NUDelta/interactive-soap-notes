import mongoose from "mongoose";
import { Snippet } from "./Snippet.js" // I don't think this works

const SectionSchema = new mongoose.Schema({
    name: {
      /* S, O, A, or P (maybe something else later?) */
  
      type: String,
      required: [true, "Please label this section."],
      maxlength: [1, "Name must be S, O, A, or P"],
    },
    // should there be another schema for SOAPnote that has an owner and SIG?
    entries: {
      /* Collection of note snippets for each section */
      type: [Snippet], // does this work
    },
  });
  
  // what is the second part of this last line doing?
  export default mongoose.models.SectionSchema || mongoose.model("Section", SectionSchema);