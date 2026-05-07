import { NextApiRequest, NextApiResponse } from 'next';
import { fetchSigWeeklyRecap } from '../../../controllers/issueObjects/fetchSigWeeklyRecap';

type Data = {
  msg: string;
  success: boolean;
  data?: any;
  error?: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(400).json({ msg: 'Route not found', success: false });
  }

  try {
    const { sigName, weekStart } = req.query;

    if (!sigName || typeof sigName !== 'string') {
      return res.status(400).json({ msg: 'sigName is required', success: false });
    }

    const weekStartDate = weekStart
      ? new Date(weekStart as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const data = await fetchSigWeeklyRecap(sigName, weekStartDate);
    return res.status(200).json({ msg: 'Fetched recap', success: true, data });
  } catch (error) {
    return res.status(400).json({ msg: 'Could not fetch recap', success: false, error });
  }
}
