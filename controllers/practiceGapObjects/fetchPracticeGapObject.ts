import dbConnect from '../../lib/dbConnect';
import PracticeGapObjectModel from '../../models/PracticeGapObjectModel';

/**
 * Fetches all project gap objects.
 * @returns {Array} Array of project gap objects or null
 */
export const fetchAllProjectGapObjects = async () => {
  await dbConnect();
  return await PracticeGapObjectModel.find({}).sort({
    sig: 1,
    project: 1,
    date: -1
  });
};

/**
 * Fetch project gap objects by list of IDs.
 * @param ids List of project gap object IDs
 * @returns {Array} Array of project gap objects or null
 */
export const fetchProjectGapObjectsByIds = async (ids: string[]) => {
  await dbConnect();
  return await PracticeGapObjectModel.find({ _id: { $in: ids } }).sort({
    sig: 1,
    project: 1,
    date: -1
  });
};
