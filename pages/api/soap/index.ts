import type { NextApiRequest, NextApiResponse } from 'next';
import { createSOAPNote } from '../../../controllers/capNotes/createSoapNote';
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
    case 'POST': // creates soap notes from input
      let projectName;
      let noteDate;
      try {
        projectName = req.body.projectName;
        noteDate = new Date(req.body.noteDate);
        let createdSOAPNote: CAPStruct = await createSOAPNote(
          projectName,
          noteDate
        );
        res.status(200).json({
          msg: 'Soap note created',
          success: true,
          data: createdSOAPNote
        });
      } catch (error) {
        console.error(
          `Error in /api/soap for creating soap note: ${projectName} -- ${noteDate}`,
          error
        );
        res.status(400).json({
          msg: 'Soap note not created',
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
