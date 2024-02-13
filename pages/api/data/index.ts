// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSoapNoteFixtures } from '../../../models/fixtures/soapNotes';

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
    method,
  } = req;

  switch (method) {
    case 'POST': // creates soap notes from fixtures
      await createSoapNoteFixtures();
      res.status(200).json({ msg: 'Soap notes created', success: true });
      break;
    default:
      res.status(400).json({ msg: 'Route not found', success: false });
      break;
  }
}
