import { NextApiRequest, NextApiResponse } from 'next';
import { updatePracticeGapObject } from '../../../controllers/practiceGapObjects/updatePracticeGapObject';
import { PracticeGapObjectStruct } from '../../../models/PracticeGapObjectModel';

type Data = {
  msg: string;
  success: boolean;
  data?: PracticeGapObjectStruct[];
  error?: any;
};

/**
 * Request handler for /api/practice-gaps
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
    case 'POST':
      let practiceGapObjects: PracticeGapObjectStruct[] = req.body.data;

      try {
        let updatedPracticeGapObjects: PracticeGapObjectStruct[] = [];
        for (let practiceGapObject of practiceGapObjects) {
          let updatedPracticeGapObject: PracticeGapObjectStruct =
            await updatePracticeGapObject(practiceGapObject);
          updatedPracticeGapObjects.push(updatedPracticeGapObject);
        }
        return res.status(200).json({
          msg: 'Practice gap objects updated',
          success: true,
          data: updatedPracticeGapObjects
        });
      } catch (error) {
        console.error(
          'Error in /api/practice-gaps for updating practice gap objects',
          error
        );
        return res.status(400).json({
          msg: 'Practice gap objects not updated',
          success: false,
          error: error
        });
      }
    default:
      console.log('running 400');
      return res.status(400).json({ msg: 'Route not found', success: false });
      break;
  }
}
