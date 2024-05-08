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

        // get org objs
        const orgObjRes = await fetch(
          `${process.env.ORCH_ENGINE}/organizationalObjects/getComputedOrganizationalObjectsForProject`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ projectName: capNote.project })
          }
        );
        const orgObjs = await orgObjRes.json();

        // create practice agents for all plans
        let practiceAgents = {};
        for (let issueIndex in capNote.currentIssues) {
          // get the current issue
          let issue = capNote.currentIssues[issueIndex];

          // loop over all notes in the plan section of the issue
          for (let planIndex in issue.plan) {
            // get the plan
            let plan = issue.plan[planIndex];

            // check if there's a valid practice agent here
            if (
              plan.value.trim() == '' ||
              !/\[(plan|reflect|help|self-work)\]/.test(plan.value.trim())
            ) {
              continue;
            }

            // get the reflection questions for the plan
            let reflectionQuestions = computeReflectionQuestions(plan);

            // parse practice text
            let parsedPractice = parsePracticeText(plan.value);

            // create the practice agent
            let practiceAgent = {
              issueId: issue.id,
              practice: plan.value,
              followUpObject: {
                practice: plan.value,
                parsedPractice: {
                  practice: parsedPractice,
                  opportunity: '', // TODO
                  person: '', // TODO
                  reflectionQuestions: reflectionQuestions
                },
                outcome: {
                  didHappen: false,
                  deliverableLink: null,
                  reflection: reflectionQuestions.map((q) => {
                    return { prompt: q.prompt, response: '' };
                  })
                }
              }
            };

            // add the practice agent to the issue
            if (issue.title in practiceAgents) {
              practiceAgents[issue.title].push(practiceAgent);
            } else {
              practiceAgents[issue.title] = [practiceAgent];
            }
          }
        }

        // create each agent
        // TODO: create pre studio message
        // TODO: create any plan follow-up messages
        // TODO: create a help-seeking agent
        let postSigScript = createPostSigMessage(
          id,
          req.body.project,
          practiceAgents,
          orgObjs
        );

        // console.log(postSigScript);
        // console.log(
        //   'strat function',
        //   postSigScript.strategyToEnact.strategy_function
        // );
        // console.log(
        //   'attempt eval',
        //   eval(postSigScript.strategyToEnact.strategy_function)
        // );

        // attempt to create an active issue in OS
        const osRes = await fetch(
          `${process.env.ORCH_ENGINE}/activeissues/createActiveIssue`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(postSigScript)
          }
        );

        // if successful, update the activeIssueId in the practice
        if (osRes.status === 200) {
          console.log(
            `Successfully created active issue for post-sig in OS for ${capNote.project}`,
            await osRes.json()
          );
        } else {
          console.error(
            `Error in creating active issue for ${capNote.project} in OS:`,
            await osRes.json()
          );
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

function createPostSigMessage(noteId, projName, practiceAgents, orgObjs) {
  let currDate = new Date();
  let weekFromCurrDate = new Date(currDate.getTime());
  weekFromCurrDate.setDate(weekFromCurrDate.getDate() + 7);
  let timezone = 'America/Chicago';

  let newActiveIssue = {
    scriptId: crypto
      .createHash('md5')
      .update(`${noteId}-post-sig`)
      .digest('hex')
      .slice(0, 24),
    scriptName: `plan follow-up after SIG for ${projName}`,
    dateTriggered: currDate,
    expiryTime: weekFromCurrDate,
    shouldRepeat: false,
    issueTarget: {
      targetType: 'project',
      name: projName
    },
    strategyToEnact: {
      name: `plan follow-up after SIG for ${projName}`,
      description: '',
      strategy_function: ''
    },
    updateIfExists: true // used to update an already created active issue
  };

  // build up strategy message by looping over practice agents
  let strategy =
    "Here's some practices for you to work on from SIG meeting.\\n\\n";
  for (let issueKey in practiceAgents) {
    let currentContent = `> ${issueKey}`;

    // sort practice agents by practice
    // from: https://stackoverflow.com/a/14872766
    let ordering = {};
    let sortOrder = ['plan', 'self-work', 'help', 'reflect'];
    for (var i = 0; i < sortOrder.length; i++) ordering[sortOrder[i]] = i;
    practiceAgents[issueKey].sort(
      (a, b) =>
        ordering[a.practice.match(/\[(.*?)\]\s*(.*)/).slice(1)[0]] -
          ordering[b.practice.match(/\[(.*?)\]\s*(.*)/).slice(1)[0]] ||
        a.followUpObject.parsedPractice.practice.localeCompare(
          b.followUpObject.parsedPractice.practice
        )
    );

    // add practice content for each practice agent
    for (let practiceAgent of practiceAgents[issueKey]) {
      currentContent += `\\n- ${practiceAgent.followUpObject.parsedPractice.practice}`;
    }
    strategy += currentContent + '\\n\\n';
  }
  strategy +=
    '---\\n' +
    "Let your mentor know if you have any challenges in doing these practices. I'll remind you about opportunities to practice later in the week (e.g., mysore, pair research).";

  // create the function to actually deliver the message
  let strategyFunction = async function () {
    return await this.messagePeople({
      message: 'strategyTextToReplace',
      people: 'peopleToMessage',
      opportunity: async function () {
        return await this.thisAfternoon('currDate', 'timezone');
      }.toString()
    });
  }.toString();

  strategyFunction = strategyFunction.replace(
    'currDate',
    currDate.toUTCString()
  );
  strategyFunction = strategyFunction.replace('timezone', timezone);

  // TODO: REMOVE HARD CODING
  strategyFunction = strategyFunction.replace(
    "'peopleToMessage'",
    `[${orgObjs.project.students.map((student) => `"${student.name}"`).join(',')}, "Kapil Garg"]`
  );
  strategyFunction = strategyFunction.replace(
    "'strategyTextToReplace'",
    '"' + strategy + '"'
  );

  // add to newActiveIssue and return
  newActiveIssue.strategyToEnact.strategy_function = strategyFunction;
  return newActiveIssue;
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

const computeReflectionQuestions = (plan) => {
  // get reflection questions based on the plan entry
  let reflectionQuestions = [];
  if (plan.value.includes('[plan]')) {
    reflectionQuestions = [];
  } else if (plan.value.includes('[reflect]')) {
    {
      reflectionQuestions = [
        {
          prompt: 'Enter your reflections on the above, based on this week.',
          responseType: 'string'
        },
        {
          prompt:
            'In general: did this reflection help you see your practices and understand why they happen? What was helpful? What obstacles do you still have?',
          responseType: 'string'
        }
      ];
    }
  } else if (plan.value.includes('[self-work]')) {
    reflectionQuestions = [
      {
        prompt: 'Did you do the work practice your mentor suggested?',
        responseType: 'boolean'
      },
      {
        prompt:
          'Share a link to any deliverable that shows what you worked on. Make sure it is accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        responseType: 'string'
      },
      {
        prompt:
          'How did your understanding change? What new risk(s) do you see?',
        responseType: 'string'
      },
      {
        prompt: 'What obstacles came up in trying to do it, if any?',
        responseType: 'string'
      }
    ];
  } else if (plan.value.includes('[help]')) {
    reflectionQuestions = [
      {
        prompt:
          'Did you do the help-seeking interaction your mentor suggested?',
        responseType: 'boolean'
      },
      {
        prompt:
          'Share a link to any deliverable that shows what you worked on. Make sure it is accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        responseType: 'string'
      },
      {
        prompt:
          'What did it help you learn or progress?  What new risk(s) do you see?',
        responseType: 'string'
      },
      {
        prompt:
          'What obstacles came up in trying to do it, if any? Were you unable to do the help-seeking interaction suggested (and if so, why not)?',
        responseType: 'string'
      }
    ];
  }

  return reflectionQuestions;
};

const parsePracticeText = (practice) => {
  // split the practice text into [practice] and content
  let [practiceTag, content] = practice.match(/\[(.*?)\]\s*(.*)/).slice(1);

  // create the parsed practice based on the practice tag
  let parsedPractice = '';
  switch (practiceTag) {
    case 'plan':
      parsedPractice =
        'Update your <${this.project.tools.sprintLog.url}|Sprint Log>: ';
      break;
    case 'reflect':
      parsedPractice = 'Reflect on your own: ';
      break;
    case 'self-work':
      parsedPractice = 'On your own, try to: ';
      break;
    case 'help':
      // check if content contains @mysore
      if (content.toLowerCase().includes('@mysore')) {
        parsedPractice = 'At Mysore: ';
        content = content.replace(/@mysore/gi, 'Mysore');
      } else if (content.toLowerCase().includes('@pair research')) {
        parsedPractice = 'At Pair Research: ';
        content = content.replace(/@pair research/gi, 'Pair Research');
      } else {
        parsedPractice = 'Help seek: '; // TODO: allow for including people
      }
      break;
    default:
      break;
  }

  // combine with content and return
  return parsedPractice + content;
};
