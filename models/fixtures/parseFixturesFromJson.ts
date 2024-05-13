import mongoose from 'mongoose';
import dbConnect from '../../lib/dbConnect';
import CAPNoteModel from '../CAPNoteModel';
import IssueObjectModel from '../IssueObjectModel';
import PracticeGapObjectModel from '../PracticeGapObjectModel';

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

// helper function to convert text entry objects
const convertTextEntry = (textEntry) => {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    type: textEntry.type,
    context: textEntry.context.map((contextEntry) => {
      return {
        id: new mongoose.Types.ObjectId().toString(),
        type: contextEntry.contextType,
        context: contextEntry.description,
        value: contextEntry.value
      };
    }),
    value: textEntry.value,
    html: textEntry.value
  };
};

// UPDATED: parses data from 05-12-24 backup onwards
export const parseFixturesFromJson = async (fixtures) => {
  // create an array to hold the parsed fixtures
  let parsedFixtures = [];

  // hold all issue objects for later
  let allIssueObjects = [];

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

    // past issues into new objects.
    const convertToIssueObject = (issue) => {
      return new IssueObjectModel({
        title: issue.title,
        date: convertTimestampToDate(issue.date['$date'], 'America/Chicago'),
        project: fixture.project,
        sig: fixture.sigName,
        lastUpdated: convertTimestampToDate(
          issue.lastUpdated['$date'],
          'America/Chicago'
        ),
        isDeleted: false,
        isMerged: false,
        mergeTarget: null,
        context: issue.context.map((contextEntry) => {
          return convertTextEntry(contextEntry);
        }),
        assessment: issue.assessment.map((assessmentEntry) => {
          return convertTextEntry(assessmentEntry);
        }),
        plan: issue.plan.map((planEntry) => {
          return convertTextEntry(planEntry);
        }),
        followUps: issue.followUps.map((followUp) => {
          return {
            id: new mongoose.Types.ObjectId().toString(),
            practice: followUp.practice,
            parsedPractice: {
              id: new mongoose.Types.ObjectId().toString(),
              practice: followUp.parsedPractice.practice,
              opportunity: followUp.parsedPractice.opportunity,
              person: followUp.parsedPractice.person,
              reflectionQuestions:
                followUp.parsedPractice.reflectionQuestions.map(
                  (reflection) => {
                    return {
                      prompt: reflection.prompt,
                      responseType: reflection.responseType,
                      forDidPractice: true
                    };
                  }
                )
            },
            outcome: {
              id: new mongoose.Types.ObjectId().toString(),
              didHappen: followUp.outcome.didHappen,
              deliverableLink: followUp.outcome.deliverableLink,
              deliverableNotes: '',
              reflections: [
                followUp.outcome.reflections.map((reflection) => {
                  return {
                    prompt: reflection.prompt,
                    response: reflection.response
                  };
                }),
                followUp.outcome.reflections.map((reflection) => {
                  return {
                    prompt: reflection.prompt,
                    response: reflection.response
                  };
                })
              ]
            }
          };
        }),
        priorInstances: []
      });
    };

    let pastIssues = fixture.pastIssues.map((issue) => {
      return convertToIssueObject(issue);
    });
    let currentIssues = fixture.currentIssues.map((issue) => {
      return convertToIssueObject(issue);
    });
    allIssueObjects = allIssueObjects.concat(pastIssues, currentIssues);

    // convert tracked practices
    const convertToPracticeGapObject = (practice, allIssues) => {
      const findIssueIdByTitle = (title, issues) => {
        let foundIssue = allIssues.find((issue) => {
          return issue.title === title;
        });

        console.log('foundIssue', foundIssue);

        return foundIssue ? foundIssue._id : null;
      };

      return new PracticeGapObjectModel({
        title: practice.title,
        date: convertTimestampToDate(practice.date['$date'], 'America/Chicago'),
        project: fixture.project,
        sig: fixture.sigName,
        description: practice.description,
        lastUpdated: convertTimestampToDate(
          practice.date['$date'],
          'America/Chicago'
        ),
        isInactive: practice.practiceInactive,
        isArchived: practice.practiceArchived,
        prevIssues: practice.prevIssues.map((issue) => {
          return findIssueIdByTitle(issue.title, allIssues);
        })
      });
    };

    let trackedPractices = fixture.trackedPractices.map((practice) => {
      return convertToPracticeGapObject(practice, allIssueObjects);
    });

    // save issues and tracked practice if they don't exist in the database
    // if they do exist, update the object
    pastIssues.forEach(async (issue) => {
      let foundIssue = await IssueObjectModel.findOne({ id: issue.id }).exec();
      if (!foundIssue) {
        await issue.save();
      } else {
        await IssueObjectModel.findOneAndUpdate(
          {
            id: issue.id
          },
          issue,
          { new: true }
        );
      }
    });

    currentIssues.forEach(async (issue) => {
      let foundIssue = await IssueObjectModel.findOne({ id: issue.id }).exec();
      if (!foundIssue) {
        await issue.save();
      } else {
        await IssueObjectModel.findOneAndUpdate(
          {
            id: issue.id
          },
          issue,
          { new: true }
        );
      }
    });

    trackedPractices.forEach(async (practice) => {
      let foundPractice = await PracticeGapObjectModel.findOne({
        id: practice.id
      }).exec();
      if (!foundPractice) {
        await practice.save();
      } else {
        await PracticeGapObjectModel.findOneAndUpdate(
          {
            id: practice.id
          },
          practice,
          { new: true }
        );
      }
    });

    // add everything to the new CAP note
    newCAPNote.context = fixture.context.map((contextEntry) => {
      return convertTextEntry(contextEntry);
    });
    newCAPNote.assessment = fixture.assessment.map((assessmentEntry) => {
      return convertTextEntry(assessmentEntry);
    });
    newCAPNote.plan = fixture.plan.map((planEntry) => {
      return convertTextEntry(planEntry);
    });
    newCAPNote.pastIssues = pastIssues.map((issue) => {
      return issue._id;
    });
    newCAPNote.currentIssues = currentIssues.map((issue) => {
      return issue._id;
    });
    newCAPNote.trackedPractices = trackedPractices.map((practice) => {
      return practice._id;
    });

    // add the new CAP note to the parsed fixtures array
    parsedFixtures.push(newCAPNote);
  });

  await dbConnect();
  return await CAPNoteModel.insertMany(parsedFixtures);
};
