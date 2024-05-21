import { NextApiRequest, NextApiResponse } from 'next';
import { updateIssueObject } from '../../../controllers/issueObjects/updateIssueObject';
import { IssueObjectStruct } from '../../../models/IssueObjectModel';

import {
  createPostSigMessage,
  computeReflectionQuestions,
  parsePracticeText
} from '../../../controllers/followUpObjects/createFollowUpStrategies';

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
      let noteInfo = req.body.noteInfo;

      // used to check if we should create follow-ups objects
      let updateType = req.body.updateType;

      try {
        let updatedIssueObjects: IssueObjectStruct[] = [];
        for (let issueObject of issueObjects) {
          let updatedIssueObject: IssueObjectStruct =
            await updateIssueObject(issueObject);
          updatedIssueObjects.push(updatedIssueObject);
        }

        // create practice agents for current issues
        if (updateType === 'current') {
          // get org objs
          const orgObjRes = await fetch(
            `${process.env.ORCH_ENGINE}/organizationalObjects/getComputedOrganizationalObjectsForProject`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ projectName: noteInfo.project })
            }
          );
          const orgObjs = await orgObjRes.json();

          // create practice agents for all plans
          let practiceAgents = {};
          for (let issue of updatedIssueObjects) {
            // console.log(issue);

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

              // parse practice text
              let parsedPractice = parsePracticeText(plan.value);

              // get the reflection questions for the plan
              let reflectionQuestions =
                computeReflectionQuestions(parsedPractice);

              // create the practice agent
              let practiceAgent = {
                issueId: issue.id,
                practice: plan.value,
                followUpObject: {
                  practice: plan.value,
                  parsedPractice: {
                    practice: `${parsedPractice.parsedPracticePrefix.trim()} ${parsedPractice.content.trim()}`,
                    opportunity: parsedPractice.opportunity.toString(),
                    person: '', // TODO
                    reflectionQuestions: [
                      ...reflectionQuestions[0].map((question) => {
                        return {
                          prompt: question.prompt,
                          responseType: question.responseType,
                          forDidPractice: false
                        };
                      }),
                      ...reflectionQuestions[1].map((question) => {
                        return {
                          prompt: question.prompt,
                          responseType: question.responseType,
                          forDidPractice: false
                        };
                      })
                    ]
                  },
                  outcome: {
                    didHappen: false,
                    deliverableLink: null,
                    deliverableNotes: null,
                    reflections: [
                      reflectionQuestions[0].map((question) => {
                        return {
                          prompt: question.prompt,
                          response: ''
                        };
                      }),
                      reflectionQuestions[1].map((question) => {
                        return {
                          prompt: question.prompt,
                          response: ''
                        };
                      })
                    ]
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

          // TODO: before replacing questions, should check if any outcomes already have content (if so, don't overwrite it)
          // TODO: also need to delete any follow-ups that are no longer in the plan
          // if we have practice agents, create their scripts
          if (Object.keys(practiceAgents).length > 0) {
            // update issue objects with follow-ups
            for (let issueIndex in updatedIssueObjects) {
              let issue = updatedIssueObjects[issueIndex];
              if (issue.title in practiceAgents) {
                let allFollowups = practiceAgents[issue.title].map((agent) => {
                  return agent.followUpObject;
                });

                // check if the issue already has follow-ups that have the same practice
                // if so, don't overwrite them
                // TODO: not working correctly
                // let newFollowups = [];
                // for (let followup of allFollowups) {
                //   let found = false;
                //   for (let existingFollowup of issue.followUps) {
                //     if (
                //       followup.practice.trim() ===
                //       existingFollowup.practice.trim()
                //     ) {
                //       found = true;
                //       // console.log('followup:', followup.practice);
                //       // console.log(
                //       //   'existingFollowup:',
                //       //   existingFollowup.practice
                //       // );
                //     }
                //   }
                //   if (!found) {
                //     // console.log('adding followup:', followup);
                //     newFollowups.push(followup);
                //   }
                // }
                // updatedIssueObjects[issueIndex].followUps = [
                //   ...issue.followUps,
                //   ...newFollowups
                // ];

                // replace the follow-ups
                updatedIssueObjects[issueIndex].followUps = allFollowups;

                // console.log(updatedIssueObjects[issueIndex].toObject());
                console.log(
                  'updated',
                  JSON.stringify(
                    await updatedIssueObjects[issueIndex].save(),
                    null,
                    2
                  )
                );
              }
            }
            // console.log('updatedIssueObjects:', updatedIssueObjects);

            // // create each agent
            // TODO: create pre studio message
            // TODO: create any plan follow-up messages
            // TODO: create a help-seeking agent
            console.log(noteInfo);
            let postSigScript = createPostSigMessage(
              noteInfo.id,
              noteInfo.project,
              new Date(noteInfo.sigDate).toISOString(),
              practiceAgents,
              orgObjs
            );
            // console.log('postSigScript:', postSigScript);
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
                `Successfully created active issue for post-sig in OS for ${noteInfo.project} - ${noteInfo.sigDate}`,
                await osRes.json()
              );
            } else {
              console.error(
                `Error in creating active issue for ${noteInfo.project} - ${noteInfo.sigDate} in OS:`,
                await osRes.json()
              );
            }
          }
        }

        // return the saved data
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
