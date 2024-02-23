import { updateSOAPNote } from '../../../controllers/soapNotes/updateSoapNote';
import dbConnect from '../../../lib/dbConnect';
import SOAPModel from '../../../models/SOAPModel';
import crypto from 'crypto';

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
  let venueOrgObj = '';
  if (venue.includes('studio')) {
    venueOrgObj = 'StudioMeeting';
  } else if (venue.includes('office hours')) {
    venueOrgObj = 'OfficeHours';
  }

  // TODO: DRY
  // TODO: add a morning of (next) SIG, after SIG
  let strategyFunction = '';
  if (venue.includes('at studio') || venue.includes('at office hours')) {
    strategyFunction = async function () {
      return await this.messageChannel({
        message: strategyFromScript,
        projectName: this.project.name,
        opportunity: async function () {
          return await this.startOfVenue(
            await this.venues.find(this.where('kind', venueOrgObj))
          );
        }.toString()
      });
    }.toString();
  } else if (venue.includes('morning')) {
    strategyFunction = async function () {
      return await this.messageChannel({
        message: strategyFromScript,
        projectName: this.project.name,
        opportunity: async function () {
          return await this.morningOfVenue(
            await this.venues.find(this.where('kind', venueOrgObj))
          );
        }.toString()
      });
    }.toString();
  } else if (venue.includes('day after SIG')) {
    strategyFunction = async function () {
      return await this.messageChannel({
        message: strategyFromScript,
        projectName: this.project.name,
        opportunity: async function () {
          let today = new Date();
          today.setMinutes(0, 0, 0);
          return await this.daysAfter(today, 1);
        }.toString()
      });
    }.toString();
  } else if (venue.includes('after SIG')) {
    strategyFunction = async function () {
      return await this.messageChannel({
        message: strategyFromScript,
        projectName: this.project.name,
        opportunity: async function () {
          return this.endOfVenue(
            this.venues.find(this.where('kind', 'SigMeeting'))
          );
        }.toString()
      });
    }.toString();
  } else if (venue.includes('after studio')) {
    strategyFunction = async function () {
      return await this.messageChannel({
        message: strategyFromScript,
        projectName: this.project.name,
        opportunity: async function () {
          return this.endOfVenue(
            this.venues.find(this.where('kind', 'StudioMeeting'))
          );
        }.toString()
      });
    }.toString();
  }

  strategyFunction = strategyFunction.replace(
    'venueOrgObj',
    `"${venueOrgObj}"`
  );
  strategyFunction = strategyFunction.replace(
    'strategyFromScript',
    `"${strategy}"`
  );
  newActiveIssue.strategyToEnact.strategy_function = strategyFunction;
  return newActiveIssue;
}

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
          return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: soapNote });
      } catch (error) {
        res.status(400).json({ success: false });
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
          console.log('Response from OS on /createActiveIssue: ', osRes);
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
