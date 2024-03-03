import { updateSOAPNote } from '../../../controllers/soapNotes/updateSoapNote';
import dbConnect from '../../../lib/dbConnect';
import SOAPModel from '../../../models/SOAPModel';
import crypto from 'crypto';

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
        const soapNote = await SOAPModel.findById(id);
        if (!soapNote) {
          return res
            .status(400)
            .json({ success: false, error: 'No SOAP note found for ID ${id}' });
        }
        res.status(200).json({ success: true, data: soapNote });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: `Error in fetching SOAP note: ${error}`
        });
      }
      break;
    case 'PUT': // update SOAP note of [id] with edits
      try {
        const soapNote = await updateSOAPNote(id, req.body);

        // TODO: updateSOAPNote is already parsing the code; so parseFollowUpPlans is redundant
        // parse actionable followups
        let actionableFollowUps = req.body['issues']
          .map((issue) => {
            return issue['followUpPlans'];
          })
          .flat();
        for (let i = 0; i < actionableFollowUps.length; i++) {
          let parsedFollowup = parseFollowUpPlans(
            id,
            req.body.project,
            actionableFollowUps[i].venue,
            actionableFollowUps[i].strategy
          );

          console.log('parsedFollowup: ', parsedFollowup);

          const osRes = await fetch(
            `${process.env.ORCH_ENGINE}/activeissues/createActiveIssue`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(parsedFollowup)
            }
          );
          console.log(
            'Response from OS on /createActiveIssue: ',
            await osRes.json()
          );
        }

        if (!soapNote) {
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: soapNote });
      } catch (error) {
        console.error(
          `Error in PUT for /api/soap/[id] for "${req.body.project}"`,
          error
        );
        res.status(400).json({ success: false });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}

/**
 * Parses follow-up plans into actionable issues for OS.
 * TODO: this code is redundant with the code in updateSOAPNote
 * @param soapId
 * @param projName
 * @param venue
 * @param strategy
 * @returns
 */
function parseFollowUpPlans(soapId, projName, venue, strategy) {
  // create object to sent to OS
  // TODO: see if I can get OS to compute the expiration date of the issue to be the day after it's sent
  let currDate = new Date();
  let weekFromCurrDate = currDate.setDate(currDate.getDate() + 7);

  let newActiveIssue = {
    scriptId: crypto
      .createHash('md5')
      .update(`${soapId}-${strategy}`)
      .digest('hex')
      .slice(0, 24),
    scriptName: `actionable follow-up for ${projName} in ${venue}`,
    dateTriggered: currDate,
    expiryTime: weekFromCurrDate,
    shouldRepeat: false,
    issueTarget: {
      targetType: 'project',
      name: projName
    },
    strategyToEnact: {
      name: `actionable follow-up for ${projName} in ${venue}`,
      description: strategy,
      strategy_function: ''
    }
  };

  // compute strategy function
  console.log(
    'In parseFollowUpPlans, inputs are: ',
    soapId,
    projName,
    venue,
    strategy
  );

  // TODO: DRY
  // TODO: 03-03-24 -- add a "next SIG" venue
  let strategyFunction = '';
  switch (venue.toLowerCase()) {
    case 'morning of office hours':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return await this.morningOfVenue(
              await this.venues.find(this.where('kind', 'OfficeHours'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'at office hours':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return await this.startOfVenue(
              await this.venues.find(this.where('kind', 'OfficeHours'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'morning of next sig':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return await this.morningOfVenue(
              await this.venues.find(this.where('kind', 'SigMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'after sig':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return this.endOfVenue(
              this.venues.find(this.where('kind', 'SigMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'morning of studio':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return await this.morningOfVenue(
              await this.venues.find(this.where('kind', 'StudioMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'at studio':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return await this.startOfVenue(
              await this.venues.find(this.where('kind', 'StudioMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'after studio':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return this.endOfVenue(
              this.venues.find(this.where('kind', 'StudioMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    default:
      strategyFunction = async function () {
        return await this.messageChannel({
          message: strategy,
          projectName: this.project.name,
          opportunity: async function () {
            return await this.startOfVenue(
              await this.venues.find(this.where('kind', 'no venue found'))
            );
          }.toString()
        });
      }.toString();
  }

  console.log(
    'In parseFollowUpPlans, strategyFunction before replacement: ',
    strategyFunction
  );
  newActiveIssue.strategyToEnact.strategy_function = strategyFunction;

  console.log('In parseFollowUpPlans, newActiveIssue: ', newActiveIssue);
  return newActiveIssue;
}
