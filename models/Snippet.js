import mongoose from "mongoose";
import { Hashtag } from "./Hashtag.js";

const SnippetSchema = new mongoose.Schema({
    text: {
      /* Content of the snippet */
  
      type: String,
      required: [true, "Snippets cannot be empty."],
    },
    script: {
      /* Script (if any) associated with a snippet */
      type: Script, // Script schema
    },
    hashtags: {
        /* Hashtag(s) associated with a snippet */
        type: [Hashtag],
      },
  });
  
  // what is the second part of this last line doing?
  export default mongoose.models.SnippetSchema || mongoose.model("Snippet", SnippetSchema);