import mongoose from "mongoose";

// not in use for now. Represents a hashtag to be attached to a note snippet.

const HashtagSchema = new mongoose.Schema({
    name: {
      /* S, O, A, or P (maybe something else later?) */
  
      type: String,
      required: [true, "Hashtags cannot be empty."],
    },
    description: {
        /* Hashtag(s) associated with a snippet */
        type: String,
      },
  });
  
  export default mongoose.models.Hashtag || mongoose.model("Hashtag", HashtagSchema);