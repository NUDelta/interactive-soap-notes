import mongoose from "mongoose";

// not currently in use
// represents a single line of a note (or bullet point)
// may have a script or hashtags associated with it

const NeedsTrackerSchema = new mongoose.Schema({
    tags: {
      /* Hashtags tracked by NeedsTracker: pull out snippets tagged that way from last note */
  
      type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Hashtag'}],
    },
    summary: {
        /* Meeting summary written in Post SOAP form. Could be a String or multiple Snippets. */
        type: [{type: mongoose.Schema.Types.ObjectId, ref: 'Snippet'}],
      },
  });

  export default mongoose.models.NeedsTracker || mongoose.model("NeedsTracker", NeedsTracker);