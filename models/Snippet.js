import mongoose from "mongoose";

// not currently in use
// represents a single line of a note (or bullet point)
// may have a script or hashtags associated with it

const SnippetSchema = new mongoose.Schema({
    text: {
      /* Content of the snippet */
  
      type: String,
      required: [true, "Snippets cannot be empty."],
    },
    script: {
      /* Script (if any) associated with a snippet */
      type: String, //Script, // Script schema
    },
    hashtags: {
        /* Hashtag(s) associated with a snippet */
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Hashtag'}],
      },
  });

  export default mongoose.models.Snippet || mongoose.model("Snippet", SnippetSchema);