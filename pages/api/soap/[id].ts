import { updateCAPNote } from '../../../controllers/capNotes/updateSoapNote';
import dbConnect from '../../../lib/dbConnect';
import SOAPModel from '../../../models/CAPNoteModel';

/**
 * Request handler for /api/soap/[id]
 * @param req
 * @param res
 * @returns
 */
export default async function handler(req, res) {
  const {
    query: { id },
    method
  } = req;
  await dbConnect();

  switch (method) {
    case 'GET': // fetch a SOAP note by [id]
      try {
        const capNote = await SOAPModel.findById(id);
        if (!capNote) {
          return res.status(400).json({
            success: false,
            data: null,
            error: 'No SOAP note found for ID ${id}'
          });
        }
        res.status(200).json({ success: true, data: capNote, error: null });
      } catch (error) {
        res.status(400).json({
          success: false,
          data: null,
          error: `Error in fetching SOAP note: ${error.message}`
        });
      }
      break;
    case 'PUT': // update CAP note of [id] with edits // TODO: all this should be doing is updating the note, not the issue content (that will be on separate routes)
      try {
        const capNote = await updateCAPNote(id, req.body);
        if (!capNote) {
          return res.status(400).json({
            success: false,
            data: null,
            error: 'SOAP Note could not be saved.'
          });
        }

        res.status(200).json({ success: true, data: capNote, error: null });
      } catch (error) {
        console.error(
          `Error in PUT for /api/soap/[id] for "${req.body.project}"`,
          error
        );
        res
          .status(400)
          .json({ success: false, data: null, error: error.message });
      }
      break;
    default:
      res.status(404).json({
        success: false,
        data: null,
        error: '/api/soap/[id] invalid request'
      });
      break;
  }
}
