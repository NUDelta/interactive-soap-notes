import mongoose from "mongoose";

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
  
  export default mongoose.models.HashtagSchema || mongoose.model("Hashtag", HashtagSchema);