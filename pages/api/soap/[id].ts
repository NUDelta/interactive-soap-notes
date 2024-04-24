import { updateCAPNote } from '../../../controllers/capNotes/updateSoapNote';
import dbConnect from '../../../lib/dbConnect';
import SOAPModel from '../../../models/CAPNoteModel';
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
    case 'PUT': // update CAP note of [id] with edits
      try {
        const capNote = await updateCAPNote(id, req.body);
        if (!capNote) {
          return res.status(400).json({
            success: false,
            data: null,
            error: 'SOAP Note could not be saved.'
          });
        }

        // TODO: update with practice agents
        // parse actionable followups
        // for (let issueIndex in capNote.issues) {
        //   let issue = capNote.issues[issueIndex];
        //   // get practices for current instance if not null
        //   if (issue.currentInstance !== null) {
        //     let currentInstance = issue.currentInstance;
        //     for (let practiceIndex in currentInstance.practices) {
        //       let practice = currentInstance.practices[practiceIndex];
        //       let parsedFollowup = parseFollowUpPlans(
        //         id,
        //         req.body.project,
        //         practice.opportunity,
        //         practice.practice
        //       );

        //       // TODO: handle case where activeIssueId is already present and an update is needed
        //       // attempt to create an active issue in OS
        //       const osRes = await fetch(
        //         `${process.env.ORCH_ENGINE}/activeissues/createActiveIssue`,
        //         {
        //           method: 'POST',
        //           headers: {
        //             'Content-Type': 'application/json'
        //           },
        //           body: JSON.stringify(parsedFollowup)
        //         }
        //       );

        //       // if successful, update the activeIssueId in the practice
        //       if (osRes.status === 200) {
        //         const osResJson = await osRes.json();
        //         capNote['issues'][issueIndex]['currentInstance']['practices'][
        //           practiceIndex
        //         ]['activeIssueId'] = osResJson.activeIssue.script_id;
        //       } else {
        //         // print that an error has happened, but don't error out the code
        //         // TODO: if there's an error, we should let the user know on the front end but on a per-issue basis. Don't outright fail the entire request. To do this, I think we need to change the response to be an array of objects, where each object is the result of the request, OR have a separate endpoint for creating follow-up practices.
        //         console.error(
        //           `Error in creating active issue for ${parsedFollowup.scriptName} in OS:`,
        //           await osRes.json()
        //         );
        //       }
        //     }
        //   }
        // }

        // resave with updated activeIssueIds
        await capNote.save();
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
  // TODO: have OS do code transformation on the scripts
  let strategyFunction = '';
  switch (venue.toLowerCase()) {
    case 'morning of office hours':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
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
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.startOfVenue(
              await this.venues.find(this.where('kind', 'OfficeHours'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'after sig':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.hoursAfterVenue(
              await this.venues.find(this.where('kind', 'SigMeeting')),
              1
            );
          }.toString()
        });
      }.toString();
      break;
    case 'day after sig':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.daysAfterVenue(
              await this.venues.find(this.where('kind', 'SigMeeting')),
              1
            );
          }.toString()
        });
      }.toString();
      break;
    case 'morning of next sig':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.morningOfVenue(
              await this.venues.find(this.where('kind', 'SigMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    case 'at next sig':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.hoursBeforeVenue(
              await this.venues.find(this.where('kind', 'SigMeeting')),
              1
            );
          }.toString()
        });
      }.toString();
      break;
    case 'morning of studio':
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
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
          message: 'strategyTextToReplace',
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
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.endOfVenue(
              await this.venues.find(this.where('kind', 'StudioMeeting'))
            );
          }.toString()
        });
      }.toString();
      break;
    default:
      strategyFunction = async function () {
        return await this.messageChannel({
          message: 'strategyTextToReplace',
          projectName: this.project.name,
          opportunity: async function () {
            return await this.startOfVenue(
              await this.venues.find(this.where('kind', 'no venue found'))
            );
          }.toString()
        });
      }.toString();
  }
  strategyFunction = strategyFunction.replace(
    'strategyTextToReplace',
    strategy
  );

  console.log(
    'In parseFollowUpPlans, strategyFunction before replacement: ',
    strategyFunction
  );
  newActiveIssue.strategyToEnact.strategy_function = strategyFunction;

  console.log('In parseFollowUpPlans, newActiveIssue: ', newActiveIssue);
  return newActiveIssue;
}
