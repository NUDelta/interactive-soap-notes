import { NextApiRequest, NextApiResponse } from 'next';
type Data = {
  msg: string;
  success: boolean;
  data?: any;
  error?: any;
};

/**
 * Request handler for /api/studio-api
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
        // get project info
        let projectName = req.body.projectName;
        let projectData = null;
        const projectDataRes = await fetch(
          `${process.env.STUDIO_API}/projects/byName?` +
            new URLSearchParams({
              projectName: projectName,
              populateTools: 'true'
            })
        );
        projectData = await projectDataRes.json();

        // get process info
        let noteDate = new Date(req.body.noteDate).toISOString();
        let processData = null;
        const processDataRes = await fetch(
          `${process.env.STUDIO_API}/sprints/byDate?` +
            new URLSearchParams({
              timestamp: noteDate
            })
        );
        processData = await processDataRes.json();

        // check if both project and process data were fetched and status was 200
        if (
          projectDataRes.status !== 200 ||
          processDataRes.status !== 200 ||
          !projectData ||
          !processData
        ) {
          return res.status(400).json({
            msg: 'Could not fetch project data from Studio API',
            success: false,
            error: 'Error in fetching project data'
          });
        }

        return res.status(200).json({
          msg: 'Fetched project data',
          success: true,
          data: { projectData, processData }
        });
      } catch (error) {
        console.error('Error in /api/studio-api when data for project', error);
        return res.status(400).json({
          msg: 'Could not fetch project data from Studio API',
          success: false,
          error: error
        });
      }
    default:
      return res.status(400).json({ msg: 'Route not found', success: false });
  }
}
