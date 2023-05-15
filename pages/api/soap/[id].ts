import { updateSOAPNote } from '../../../controllers/soapNotes/updateSoapNote';
import dbConnect from '../../../lib/dbConnect';
import SOAPModel from '../../../models/SOAPModel';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  console.log('id', id);
  console.log('body', req.body);

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const soapNote = await SOAPModel.findById(id);
        if (!soapNote) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: soapNote });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;
    case 'PUT':
      try {
        const soapNote = await updateSOAPNote(id, req.body);

        // // TODO: run middleware to parse out parts of soap notes
        // // update timestamp
        // req.body.lastUpdated = new Date();

        // const soapNote = await SOAPModel.findByIdAndUpdate(id, req.body, {
        //   new: true,
        //   runValidators: true,
        // });
        console.log(soapNote);

        if (!soapNote) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: soapNote });
      } catch (error) {
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
