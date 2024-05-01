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
  return date;
};

// UPDATED: parses data from 04-29-24 backup onwards
export const parseFixturesFromJson = async (fixtures) => {
  // create an array to hold the parsed fixtures
  let parsedFixtures = [];

  // loop through the fixtures and parse them
  fixtures.forEach((fixture) => {
    // store note date
    let noteDate = convertTimestampToDate(
      fixture.date['$date'],
      'America/Chicago'
    );
    let lastUpdated = convertTimestampToDate(
      fixture.lastUpdated['$date'],
      'America/Chicago'
    );

    // create a new CAP note object to hold everything
    let newCAPNote = new CAPNoteModel({
      project: fixture.project,
      date: noteDate,
      lastUpdated: lastUpdated,
      sigName: fixture.sigName,
      sigAbbreviation: fixture.sigAbbreviation,
      context: [],
      assessment: [],
      plan: [],
      pastIssues: [],
      currentIssues: [],
      trackedPractices: []
    });

    // parse context
    let context = [];
    fixture.context.forEach((contextEntry) => {
      context.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: contextEntry.context,
        value: contextEntry.value
      });
    });

    // parse assessment
    let assessment = [];
    fixture.assessment.forEach((assessmentEntry) => {
      assessment.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: assessmentEntry.context,
        value: assessmentEntry.value
      });
    });

    // parse plan
    let plan = [];
    fixture.plan.forEach((planEntry) => {
      plan.push({
        id: new mongoose.Types.ObjectId().toString(),
        type: 'note',
        context: planEntry.context,
        value: planEntry.value
      });
    });

    // convert trackedPractices from fixture into currentIssues and trackedPractices
    let pastIssues = [];
    let currentIssues = [];
    let trackedPractices = [];

    fixture.trackedPractices.forEach((practice) => {
      // get the current data of the practice
      let practiceLastUpdated = convertTimestampToDate(
        practice.lastUpdated['$date'],
        'America/Chicago'
      );

      // if there's a current instance of the practice, create a new current issue for it
      let currPracticeInstance =
        practice.currentInstance === null
          ? null
          : {
              id: new mongoose.Types.ObjectId().toString(),
              title: practice.title,
              date: convertTimestampToDate(
                practice.currentInstance.date['$date'],
                'America/Chicago'
              ),
              lastUpdated: convertTimestampToDate(
                practice.currentInstance.date['$date'],
                'America/Chicago'
              ),
              context: practice.currentInstance.context.map((contextEntry) => {
                return {
                  id: new mongoose.Types.ObjectId().toString(),
                  type: 'note',
                  context: contextEntry.context,
                  value: contextEntry.value
                };
              }),
              assessment: practice.currentInstance.assessment.map(
                (assessmentEntry) => {
                  return {
                    id: new mongoose.Types.ObjectId().toString(),
                    type: 'note',
                    context: assessmentEntry.context,
                    value: assessmentEntry.value
                  };
                }
              ),
              plan: practice.currentInstance.plan.map((planEntry) => {
                return {
                  id: new mongoose.Types.ObjectId().toString(),
                  type: 'note',
                  context: planEntry.context,
                  value: planEntry.value
                };
              }),
              followUps:
                practice.currentInstance.followUps.length == 0
                  ? computeFollowUpObjects(practice.currentInstance.plan) // compute if no follow-ups are already there
                  : practice.currentInstance.followUps.map((followUp) => {
                      return {
                        id: new mongoose.Types.ObjectId().toString(),
                        practice: followUp.practice,
                        parsedPractice: {
                          id: new mongoose.Types.ObjectId().toString(),
                          practice: followUp.practice,
                          opportunity: '',
                          person: '',
                          reflectionQuestions: []
                        },
                        outcome: {
                          id: new mongoose.Types.ObjectId().toString(),
                          didHappen: followUp.outcome.didHappen,
                          deliverableLink: followUp.outcome.deliverableLink,
                          reflections: followUp.outcome.reflections.map(
                            (reflection) => {
                              return {
                                prompt: reflection.prompt,
                                response: reflection.response
                              };
                            }
                          )
                        }
                      };
                    })
            };
      if (currPracticeInstance !== null) {
        currentIssues.push(currPracticeInstance);
      }

      // for each prior instance, check if the date is within 1 week of the noteDate. add as a pastIssue if so
      practice.priorInstances.forEach((instance) => {
        let instanceDate = new Date(instance.date['$date']);
        let roundedInstanceDate = new Date(
          instanceDate.getFullYear(),
          instanceDate.getMonth(),
          instanceDate.getDate()
        );

        let oneWeekAgoFromCurrNote = new Date(
          noteDate.getFullYear(),
          noteDate.getMonth(),
          noteDate.getDate()
        );
        oneWeekAgoFromCurrNote.setDate(oneWeekAgoFromCurrNote.getDate() - 7);

        if (
          instanceDate >= oneWeekAgoFromCurrNote &&
          instanceDate <= noteDate
        ) {
          pastIssues.push({
            id: new mongoose.Types.ObjectId().toString(),
            title: practice.title,
            date: roundedInstanceDate,
            lastUpdated: instanceDate,
            context: instance.context.map((contextEntry) => {
              return {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'note',
                context: contextEntry.context,
                value: contextEntry.value
              };
            }),
            assessment: instance.assessment.map((assessmentEntry) => {
              return {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'note',
                context: assessmentEntry.context,
                value: assessmentEntry.value
              };
            }),
            plan: instance.plan.map((planEntry) => {
              return {
                id: new mongoose.Types.ObjectId().toString(),
                type: 'note',
                context: planEntry.context,
                value: planEntry.value
              };
            }),
            followUps:
              instance.followUps.length == 0
                ? computeFollowUpObjects(instance.plan) // compute if no follow-ups are already there
                : instance.followUps.map((followUp) => {
                    return {
                      id: new mongoose.Types.ObjectId().toString(),
                      practice: followUp.practice,
                      parsedPractice: {
                        id: new mongoose.Types.ObjectId().toString(),
                        practice: followUp.practice,
                        opportunity: '',
                        person: '',
                        reflectionQuestions: []
                      },
                      outcome: {
                        id: new mongoose.Types.ObjectId().toString(),
                        didHappen: followUp.outcome.didHappen,
                        deliverableLink: followUp.outcome.deliverableLink,
                        reflections: followUp.outcome.reflections.map(
                          (reflection) => {
                            return {
                              prompt: reflection.prompt,
                              response: reflection.response
                            };
                          }
                        )
                      }
                    };
                  })
          });
        }
      });

      // TODO: add remaining as tracked practices (data model is different)
      trackedPractices.push({
        id: new mongoose.Types.ObjectId().toString(),
        title: practice.title,
        description: practice.description,
        date: convertTimestampToDate(
          practice.lastUpdated['$date'],
          'America/Chicago'
        ),
        lastUpdated: convertTimestampToDate(
          practice.lastUpdated['$date'],
          'America/Chicago'
        ),
        practiceInactive: practice.issueInactive,
        practiceArchived: practice.issueArchived,
        prevIssues: []
      });
    });

    // add everything to the new CAP note
    newCAPNote.context = context;
    newCAPNote.assessment = assessment;
    newCAPNote.plan = plan;
    newCAPNote.pastIssues = pastIssues;
    newCAPNote.currentIssues = currentIssues;
    newCAPNote.trackedPractices = trackedPractices;

    // add the new CAP note to the parsed fixtures array
    parsedFixtures.push(newCAPNote);
  });

  await dbConnect();
  return await CAPNoteModel.insertMany(parsedFixtures);
};

const computeFollowUpObjects = (plan) => {
  // parse followUp plans into blocks
  let followUpPlans = plan.map((planEntry) => {
    return {
      id: new mongoose.Types.ObjectId().toString(),
      type: 'note',
      context: planEntry.context,
      value: planEntry.value
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
    } else if (planEntry.value.includes('[help]')) {
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
            'How did your understanding change? What new risk(s) do you see?',
          responseType: 'string'
        },
        {
          prompt: 'What obstacles came up in trying to do it, if any?',
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
