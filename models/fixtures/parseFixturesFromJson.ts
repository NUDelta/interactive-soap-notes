import mongoose from 'mongoose';
import CAPNoteModel from '../CAPNoteModel';
import dbConnect from '../../lib/dbConnect';

/**
 *
 * @param timestamp
 * @param timezone e.g., America/Chicago
 * @returns
 */
const convertTimestampToDate = (timestamp, timezone) => {
  // convert timestamp from date and timezone into utc
  let date = new Date(timestamp);
  // let utcDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return date;
};

export const parseFixturesFromJson = async (fixtures) => {
  // create an array to hold the parsed fixtures
  let parsedFixtures = [];

  // loop through the fixtures and parse them
  fixtures.forEach((fixture) => {
    // create a new CAP note object to hold everything
    let newCAPNote = new CAPNoteModel({
      project: fixture.project,
      date: convertTimestampToDate(
        Number(fixture.date['$date']['$numberLong']),
        'America/Chicago'
      ),
      lastUpdated: convertTimestampToDate(
        Number(fixture.lastUpdated['$date']['$numberLong']),
        'America/Chicago'
      ),
      sigName: fixture.sigName,
      sigAbbreviation: fixture.sigAbbreviation,
      context: [],
      assessment: [],
      plan: [],
      trackedPractices: [],
      currIssueInstances: []
    });

    // parse context
    let context = [];
    fixture.subjective.forEach((contextEntry) => {
      context.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: contextEntry.context,
        value: contextEntry.value
      });
    });
    fixture.objective.forEach((contextEntry) => {
      context.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: contextEntry.context,
        value: contextEntry.value.replace(' - ', '').trim()
      });
    });

    // parse assessment
    let assessment = [];
    fixture.assessment.forEach((assessmentEntry) => {
      assessment.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: assessmentEntry.context,
        value: assessmentEntry.value.replace(' - ', '').trim()
      });
    });

    // parse plan
    let plan = [];
    fixture.plan.forEach((planEntry) => {
      plan.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: planEntry.context,
        value: planEntry.value.replace(' - ', '').trim()
      });
    });

    // parse trackedPractices
    let trackedPractices = [];
    fixture.issues.forEach((practice) => {
      let currPracticeInstance =
        practice.currentInstance === null
          ? null
          : {
              id: new mongoose.Types.ObjectId().toString(),
              date: convertTimestampToDate(
                Number(practice.currentInstance.date['$date']['$numberLong']),
                'America/Chicago'
              ),
              context: practice.currentInstance.context
                .split('\n')
                .map((contextEntry) => {
                  return {
                    id: new mongoose.Types.ObjectId().toString(),
                    type: 'note',
                    context: [],
                    value: contextEntry.replace(/^-/gm, '').trim()
                  };
                }),
              assessment: practice.currentInstance.summary
                .split('\n')
                .map((assessmentEntry) => {
                  return {
                    id: new mongoose.Types.ObjectId().toString(),
                    type: 'note',
                    context: [],
                    value: assessmentEntry.replace(/^-/gm, '').trim()
                  };
                }),
              plan: practice.currentInstance.plan
                .split('\n')
                .map((planEntry) => {
                  return {
                    id: new mongoose.Types.ObjectId().toString(),
                    type: 'note',
                    context: [],
                    value: planEntry.replace(/^-/gm, '').trim()
                  };
                }),
              followUps: computeFollowUpObjects(practice.currentInstance.plan)
            };

      trackedPractices.push({
        id: new mongoose.Types.ObjectId().toString(),
        title: practice.title,
        description: practice.description,
        lastUpdated: convertTimestampToDate(
          Number(practice.lastUpdated['$date']['$numberLong']),
          'America/Chicago'
        ),
        practiceInactive: practice.issueInactive,
        practiceArchived: practice.issueArchived,
        currentInstance: currPracticeInstance,
        priorInstances: practice.priorInstances.map((instance) => {
          return {
            id: new mongoose.Types.ObjectId().toString(),
            date: new Date(Number(instance.date['$date']['$numberLong'])),
            context: instance.context.split('\n').map((contextEntry) => {
              return {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'note',
                context: [],
                value: contextEntry.replace(/^-/gm, '').trim()
              };
            }),
            assessment: instance.summary.split('\n').map((assessmentEntry) => {
              return {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'note',
                context: [],
                value: assessmentEntry.replace(/^-/gm, '').trim()
              };
            }),
            plan: instance.plan.split('\n').map((planEntry) => {
              return {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'note',
                context: [],
                value: planEntry.replace(/^-/gm, '').trim()
              };
            }),
            followUps: []
          };
        })
      });
    });

    // get current instances from tracked practices
    let currIssueInstances = [];
    trackedPractices.forEach((practice) => {
      // add current instance if not null
      if (practice.currentInstance)
        currIssueInstances.push(practice.currentInstance);
    });

    // add everything to the new CAP note
    newCAPNote.context = context;
    newCAPNote.assessment = assessment;
    newCAPNote.plan = plan;
    newCAPNote.trackedPractices = trackedPractices;
    newCAPNote.currIssueInstances = currIssueInstances;

    // add the new CAP note to the parsed fixtures array
    parsedFixtures.push(newCAPNote);
  });

  await dbConnect();
  return await CAPNoteModel.insertMany(parsedFixtures);
};

const computeFollowUpObjects = (plan) => {
  // parse followUp plans into blocks
  let followUpPlans = plan.split('\n').map((planEntry) => {
    return {
      id: new mongoose.Types.ObjectId().toString(),
      type: 'note',
      context: [],
      value: planEntry.replace(/^-/gm, '').trim()
    };
  });

  // store followUp objects
  let followUps = [];

  // for each followUp plan, create a followUp object
  followUpPlans.forEach((planEntry) => {
    // get reflection questions based on the plan entry
    let reflectionQuestions = [];
    if (planEntry.value.includes('[plan]')) {
      reflectionQuestions = [];
    } else if (planEntry.value.includes('[reflect]')) {
      {
        reflectionQuestions = [
          {
            prompt: 'Enter your reflections on the above, based on this week',
            responseType: 'string'
          },
          {
            prompt:
              'In general: did this reflection help you see your practices and understand why they happen? What was helpful? What obstacles do you still have?',
            responseType: 'string'
          }
        ];
      }
    } else if (planEntry.value.includes('[self-work]')) {
      reflectionQuestions = [
        {
          prompt: 'Did you do the work practice your mentor suggested?',
          responseType: 'boolean'
        },
        {
          prompt: 'If not, what obstacles came up in trying to do it?',
          responseType: 'string'
        },
        {
          prompt:
            'If yes, share a link to any deliverable that shows what you worked on',
          responseType: 'string'
        },
        {
          prompt:
            'If yes, how did your understanding change? What new risk(s) do you see?',
          responseType: 'string'
        }
      ];
    } else if (planEntry.value.includes('[help]')) {
      reflectionQuestions = [
        {
          prompt:
            'Did you do the help-seeking interaction your mentor suggested?',
          responseType: 'boolean'
        },
        {
          prompt: 'If not, why weren’t you able to do it?',
          responseType: 'string'
        },
        {
          prompt:
            'If yes, share a link to any deliverable that shows what you worked on',
          responseType: 'string'
        },
        {
          prompt:
            'If yes, what did it help you learn or progress?  What new risk(s) do you see?',
          responseType: 'string'
        }
      ];
    }

    followUps.push({
      id: new mongoose.Types.ObjectId().toString(),
      practice: planEntry.value,
      parsedPractice: {
        id: new mongoose.Types.ObjectId().toString(),
        practice: planEntry.value,
        opportunity: '',
        person: '',
        reflectionQuestions: reflectionQuestions
      },
      outcome: {
        id: new mongoose.Types.ObjectId().toString(),
        didHappen: false,
        deliverableLink: '',
        reflections: reflectionQuestions.map((question) => {
          return {
            prompt: question.prompt,
            response: ''
          };
        })
      }
    });
  });

  return followUps;
};
