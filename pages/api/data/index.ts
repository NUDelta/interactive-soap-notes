// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSoapNoteFixtures } from '../../../models/fixtures/soapNotes';
import { parseFixturesFromJson } from '../../../models/fixtures/parseFixturesFromJson';
import CAPNoteModel from '../../../models/CAPNoteModel';
import dbConnect from '../../../lib/dbConnect';

type Data = {
  msg: string;
  success: boolean;
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
    case 'POST':
      // creates soap notes from fixtures passed in as JSON
      let jsonInput;
      let shouldClear;
      try {
        // parse input parameters
        jsonInput = req.body.fixtures;
        shouldClear = req.body.shouldClear || false;

        // clear the fixtures if requested
        if (shouldClear) {
          console.log('Clearing CAP notes');
          await dbConnect();
          await CAPNoteModel.deleteMany({});
        }

        // create fixtures
        let parsedFixtures = await parseFixturesFromJson(jsonInput);
        res.status(200).json({
          msg: `CAP notes created from fixtures. ${shouldClear ? 'Fixtures were cleared.' : ''}`,
          success: true,
          data: parsedFixtures
        });
      } catch (error) {
        console.error(
          `Error in /api/data for creating CAP notes with fixtures`,
          error
        );
        res.status(400).json({
          msg: 'CAP note from fixtures not created ',
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
