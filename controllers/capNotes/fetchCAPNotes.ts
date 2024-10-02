import dbConnect from '../../lib/dbConnect';
import CAPNoteModel from '../../models/CAPNoteModel';

/**
 * Fetches all CAP notes.
 * @returns {Array} Array of CAP notes or null
 */
export const fetchAllCAPNotes = async () => {
  await dbConnect();
  return await CAPNoteModel.find({}).sort({ sigName: 1, date: 1 });
};

/**
 * Fetches a CAP note by sig name and date.
 * @param sigName Sig name (e.g., RALE)
 * @param date Date in YYYY-MM-DD format (e.g., 2023-05-08)
 * @param project Project name
 * @returns {Object} CAP note object or null
 */
export const fetchCAPNote = async (
  sigName: string,
  project: string,
  date: string
) => {
  await dbConnect();

  console.log('sigName:', sigName);
  console.log('project:', project);
  console.log('date:', date);

  // get current CAP note
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  startDate.setHours(startDate.getHours() + 2);
  endDate.setHours(endDate.getHours() + 2);

  console.log('startDate:', startDate);
  console.log('endDate:', endDate);

  let currentCAPNote = await CAPNoteModel.findOne({
    sigAbbreviation: sigName.toUpperCase(),
    project: project,
    date: { $gte: startDate, $lte: endDate }
  });

  console.log('currentCAPNote:', currentCAPNote);

  return currentCAPNote;
};
