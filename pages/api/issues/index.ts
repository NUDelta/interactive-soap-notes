import { NextApiRequest, NextApiResponse } from 'next';
import { updateIssueObject } from '../../../controllers/issueObjects/updateIssueObject';
import { IssueObjectStruct } from '../../../models/IssueObjectModel';

type Data = {
  msg: string;
  success: boolean;
  data?: IssueObjectStruct[];
  error?: any;
};

/**
 * Request handler for /api/issue
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
    // TODO: something about the plans is re-generating the ids
    case 'POST':
      let issueObjects: IssueObjectStruct[] = req.body.data;

      // used to check if we should create follow-ups objects
      let updateType = req.body.updateType;

      try {
        let updatedIssueObjects: IssueObjectStruct[] = [];
        for (let issueObject of issueObjects) {
          let updatedIssueObject: IssueObjectStruct =
            await updateIssueObject(issueObject);
          updatedIssueObjects.push(updatedIssueObject);
        }
        return res.status(200).json({
          msg: 'Issue objects updated',
          success: true,
          data: updatedIssueObjects
        });
      } catch (error) {
        console.error('Error in /api/issue for updating issue objects', error);
        return res.status(400).json({
          msg: 'Issue objects not updated',
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

// TODO: all this should get moved into a route for issues
// // get org objs
// const orgObjRes = await fetch(
//   `${process.env.ORCH_ENGINE}/organizationalObjects/getComputedOrganizationalObjectsForProject`,
//   {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ projectName: capNote.project })
//   }
// );
// const orgObjs = await orgObjRes.json();

// // TODO: all this should get moved into a route for issues
// // create practice agents for all plans
// let practiceAgents = {};
// for (let issueIndex in capNote.currentIssues) {
//   // get the current issue
//   let issue = capNote.currentIssues[issueIndex];

//   // loop over all notes in the plan section of the issue
//   for (let planIndex in issue.plan) {
//     // get the plan
//     let plan = issue.plan[planIndex];

//     // check if there's a valid practice agent here
//     if (
//       plan.value.trim() == '' ||
//       !/\[(plan|reflect|help|self-work)\]/.test(plan.value.trim())
//     ) {
//       continue;
//     }

//     // TODO: before replacing questions, should check if any outcomes already have content (if so, don't overwrite it)
//     // get the reflection questions for the plan
//     let reflectionQuestions = computeReflectionQuestions(plan);

//     // parse practice text
//     let parsedPractice = parsePracticeText(plan.value);

//     // create the practice agent
//     let practiceAgent = {
//       issueId: issue.id,
//       practice: plan.value,
//       followUpObject: {
//         practice: plan.value,
//         parsedPractice: {
//           practice: parsedPractice,
//           opportunity: '', // TODO
//           person: '', // TODO
//           reflectionQuestions: reflectionQuestions
//         },
//         outcome: {
//           didHappen: false,
//           deliverableLink: null,
//           reflections: reflectionQuestions.map((q) => {
//             return { prompt: q.prompt, response: '' };
//           })
//         }
//       }
//     };

//     // add the practice agent to the issue
//     if (issue.title in practiceAgents) {
//       practiceAgents[issue.title].push(practiceAgent);
//     } else {
//       practiceAgents[issue.title] = [practiceAgent];
//     }
//   }
// }

// // if we have practice agents, create their scripts
// if (Object.keys(practiceAgents).length > 0) {
//   // update cap note with the followups
//   for (let issueIndex in capNote.currentIssues) {
//     let issue = capNote.currentIssues[issueIndex];
//     if (issue.title in practiceAgents) {
//       // TODO: this overwrites any changes to followups that were made
//       let allFollowups = practiceAgents[issue.title].map((agent) => {
//         return agent.followUpObject;
//       });
//       capNote.currentIssues[issueIndex].followUps = allFollowups;
//     }
//   }
//   await capNote.save();

//   // create each agent
//   // TODO: create pre studio message
//   // TODO: create any plan follow-up messages
//   // TODO: create a help-seeking agent
//   let postSigScript = createPostSigMessage(
//     id,
//     req.body.project,
//     practiceAgents,
//     orgObjs
//   );

//   console.log('postSigScript:', postSigScript);

//   // console.log(postSigScript);
//   // console.log(
//   //   'strat function',
//   //   postSigScript.strategyToEnact.strategy_function
//   // );
//   // console.log(
//   //   'attempt eval',
//   //   eval(postSigScript.strategyToEnact.strategy_function)
//   // );

//   // attempt to create an active issue in OS
//   const osRes = await fetch(
//     `${process.env.ORCH_ENGINE}/activeissues/createActiveIssue`,
//     {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify(postSigScript)
//     }
//   );

//   // if successful, update the activeIssueId in the practice
//   if (osRes.status === 200) {
//     console.log(
//       `Successfully created active issue for post-sig in OS for ${capNote.project}`,
//       await osRes.json()
//     );
//   } else {
//     console.error(
//       `Error in creating active issue for ${capNote.project} in OS:`,
//       await osRes.json()
//     );
//   }
// }
