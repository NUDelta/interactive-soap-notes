import mongoose from "mongoose";

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
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Hashtag'}],
      },
  });

  export default mongoose.models.SnippetSchema || mongoose.model("Snippet", SnippetSchema);