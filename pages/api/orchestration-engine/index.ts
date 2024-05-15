import { NextApiRequest, NextApiResponse } from 'next';
type Data = {
  msg: string;
  success: boolean;
  data?: any;
  error?: any;
};

/**
 * Request handler for /api/orchestration-engine
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
      try {
        let projectName = req.body.projectName;
        let orgObjs = null;
        const orgObjRes = await fetch(
          `${process.env.ORCH_ENGINE}/organizationalObjects/getComputedOrganizationalObjectsForProject`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ projectName: projectName })
          }
        );
        orgObjs = await orgObjRes.json();

        return res.status(200).json({
          msg: 'Fetched organizational objects',
          success: true,
          data: orgObjs
        });
      } catch (error) {
        console.error(
          'Error in /api/orchestration-engine when fetching organizational objects',
          error
        );
        return res.status(400).json({
          msg: 'Could not fetch organizational objects from Orchestration Engine',
          success: false,
          error: error
        });
      }
    default:
      return res.status(400).json({ msg: 'Route not found', success: false });
  }
}
