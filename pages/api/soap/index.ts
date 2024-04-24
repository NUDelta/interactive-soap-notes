import type { NextApiRequest, NextApiResponse } from 'next';
import { createCAPNote } from '../../../controllers/capNotes/createSoapNote';
import { CAPStruct } from '../../../models/CAPNoteModel';

type Data = {
  msg: string;
  success: boolean;
  data?: CAPStruct;
  error?: any;
};

/**
 * Request handler for /api/data
 * @param req
 * @param res
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const {
    query: { id },
    method
  } = req;
  switch (method) {
    case 'POST': // creates CAP notes from input
      let projectName;
      let noteDate;
      try {
        projectName = req.body.projectName;
        noteDate = new Date(req.body.noteDate);
        let createdCAPNote: CAPStruct = await createCAPNote(
          projectName,
          noteDate
        );
        res.status(200).json({
          msg: 'CAP note created',
          success: true,
          data: createdCAPNote
        });
      } catch (error) {
        console.error(
          `Error in /api/soap for creating CAP note: ${projectName} -- ${noteDate}`,
          error
        );
        res.status(400).json({
          msg: 'CAP note not created',
          success: false,
          error: error
        });
      }

      break;
    default:
      res.status(400).json({ msg: 'Route not found', success: false });
      break;
  }
}
