import dbConnect from '../../lib/dbConnect';
import IssueObjectModel from '../../models/IssueObjectModel';

/**
 * Fetches all issue objects.
 * @returns {Array} Array of issue objects or null
 */
export const fetchAllIssueObjects = async () => {
  await dbConnect();
  return await IssueObjectModel.find({}).sort({ sig: 1, project: 1, date: -1 });
};

/**
 * Fetch issue objects by list of IDs.
 * @param ids List of issue object IDs
 * @returns {Array} Array of issue objects or null
 */
export const fetchIssueObjectsByIds = async (ids: string[]) => {
  await dbConnect();
  return await IssueObjectModel.find({ _id: { $in: ids } }).sort({
    sig: 1,
    project: 1,
    date: -1
  });
};
