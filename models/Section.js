import mongoose from "mongoose";
import { Snippet } from "./Snippet.js" // I don't think this works

const SectionSchema = new mongoose.Schema({
    name: {
      /* S, O, A, or P (maybe something else later?) */
      type: String,
      enum: ['S', 'O', 'A', 'P'],
      required: [true, "Please label this section."],
    },
    entries: {
      /* Collection of note snippets for each section */
      type: String, // does this work
    }, // change back to [Hashtag] later
  });
  
  export default mongoose.models.SectionSchema || mongoose.model("Section", SectionSchema);