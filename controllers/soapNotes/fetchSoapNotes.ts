import dbConnect from '../../lib/dbConnect';
import SOAPModel from '../../models/SOAPModel';

/**
 * Fetches all soap notes.
 * @returns {Array} Array of soap notes or null
 */
export const fetchAllSoapNotes = async () => {
  await dbConnect();
  return await SOAPModel.find({});
};

/**
 * Fetches a soap note by sig name and date.
 * @param sigName Sig name (e.g., RALE)
 * @param date Date in YYYY-MM-DD format (e.g., 2023-05-08)
 * @param project Project name
 * @returns {Object} Soap note object or null
 */
export const fetchSoapNote = async (
  sigName: string,
  project: string,
  date: string
) => {
  await dbConnect();

  // get current soap note
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  let currentSoapNote = await SOAPModel.findOne({
    sigAbbreviation: sigName.toUpperCase(),
    project: project,
    date: { $gte: startDate, $lte: endDate },
  });

  // get previous SOAP note for context
  // TODO: this is jank -- setup a field with a ref to the previous SOAP note
  // TODO: think about a compact and "full" representation of the sections that a user can switch between
  let priorSoapNote = await SOAPModel.findOne({
    sigAbbreviation: sigName.toUpperCase(),
    date: { $lt: startDate },
  });

  if (priorSoapNote) {
    currentSoapNote.priorContext = {
      notedAssessments: priorSoapNote.notedAssessments,
      followUpPlans: priorSoapNote.plan,
    };
    await currentSoapNote.save();
  }

  return currentSoapNote;
};
