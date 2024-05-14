import mongoose from 'mongoose';
import dbConnect from '../../lib/dbConnect';
import CAPNoteModel, { CAPStruct } from '../CAPNoteModel';
import IssueObjectModel from '../IssueObjectModel';
import PracticeGapObjectModel from '../PracticeGapObjectModel';
import { htmlToText } from '../../lib/helperFns';

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
    value: htmlToText(textEntry.value).trim(),
    html: textEntry.value
  };
};

// UPDATED: parses data from 05-12-24 backup onwards
export const parseFixturesFromJson = async (fixtures) => {
  // create an array to hold the parsed fixtures
  let parsedFixtures = [];

  // hold all issue objects for later
  let allIssueObjects = [];

  // sort fixtures by lastUpdated date
  // this is to prevent overwriting of issues and practices with older data (e.g., if a practice is updated in a later fixture, we want to keep the latest data)
  fixtures.sort((a, b) => {
    return a.lastUpdated['$date'] - b.lastUpdated['$date'];
  });

  // loop through the fixtures and parse them
  for (const fixture of fixtures) {
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
    let newCAPNote: CAPStruct = new CAPNoteModel({
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

    // convert tracked practices and save if they don't exist in the database
    const convertToPracticeGapObject = (practice) => {
      return {
        title: htmlToText(practice.title).trim(),
        date: convertTimestampToDate(practice.date['$date'], 'America/Chicago'),
        project: fixture.project,
        sig: fixture.sigName,
        description: htmlToText(practice.description).trim(),
        lastUpdated: convertTimestampToDate(
          practice.lastUpdated['$date'],
          'America/Chicago'
        ),
        practiceInactive: practice.practiceInactive,
        practiceArchived: practice.practiceArchived,
        prevIssues: []
      };
    };

    let parsedTrackedPractice = fixture.trackedPractices.map((practice) => {
      return convertToPracticeGapObject(practice);
    });

    for (const practice of parsedTrackedPractice) {
      let foundPractice = await PracticeGapObjectModel.findOne({
        title: practice.title,
        sig: practice.sig,
        project: practice.project
      });

      if (!foundPractice) {
        await new PracticeGapObjectModel(practice).save();
      } else {
        // check if the current practice has a newer timestamp than the older one
        if (practice.lastUpdated > foundPractice.lastUpdated) {
          await PracticeGapObjectModel.findOneAndUpdate(
            {
              title: practice.title,
              sig: practice.sig,
              project: practice.project
            },
            practice,
            { upsert: true }
          );
        }
      }
    }

    // past issues into new objects, while also linking any of their assessments to tracked practices
    let trackedPractices = await PracticeGapObjectModel.find({});
    const convertToIssueObject = (issue) => {
      // special case: if the content of an assessment in an issue (minus [practice gap]) matches a practice gap by title, link it in its context by id
      let newAssessments = issue.assessment.map((assessmentEntry) => {
        return convertTextEntry(assessmentEntry);
      });
      newAssessments = newAssessments.map((assessmentEntry) => {
        // get the assessment value without [practice gap]
        let assessmentValue = assessmentEntry.value
          .replace('[practice gap]', '')
          .trim();
        let foundPractice = trackedPractices.find((practice) => {
          return practice.title.trim() === assessmentValue;
        });

        // update the practice gap context if found
        if (foundPractice) {
          assessmentEntry.context.push({
            contextType: 'practice',
            description: `assessment attached from practice gap: ${foundPractice.title}`,
            value: foundPractice.title
          });
        }
        return assessmentEntry;
      });

      return {
        title: htmlToText(issue.title).trim(),
        date: convertTimestampToDate(issue.date['$date'], 'America/Chicago'),
        project: fixture.project,
        sig: fixture.sigName,
        lastUpdated: convertTimestampToDate(
          issue.lastUpdated['$date'],
          'America/Chicago'
        ),
        wasDeleted: false,
        wasMerged: false,
        mergeTarget: null,
        context: issue.context.map((contextEntry) => {
          return convertTextEntry(contextEntry);
        }),
        assessment: newAssessments,
        plan: issue.plan.map((planEntry) => {
          return convertTextEntry(planEntry);
        }),
        followUps: issue.followUps.map((followUp) => {
          return {
            id: new mongoose.Types.ObjectId().toString(),
            practice: followUp.practice,
            parsedPractice: {
              id: new mongoose.Types.ObjectId().toString(),
              practice: htmlToText(followUp.parsedPractice.practice).trim(),
              opportunity: followUp.parsedPractice.opportunity,
              person: followUp.parsedPractice.person,
              reflectionQuestions:
                followUp.parsedPractice.reflectionQuestions.map(
                  (reflection) => {
                    return {
                      prompt: htmlToText(reflection.prompt).trim(),
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
                    prompt: htmlToText(reflection.prompt).trim(),
                    response: reflection.response
                  };
                }),
                followUp.outcome.reflections.map((reflection) => {
                  return {
                    prompt: htmlToText(reflection.prompt).trim(),
                    response: reflection.response
                  };
                })
              ]
            }
          };
        }),
        priorInstances: []
      };
    };

    let parsedPastIssues = fixture.pastIssues.map((issue) => {
      return convertToIssueObject(issue);
    });
    let parsedCurrentIssues = fixture.currentIssues.map((issue) => {
      return convertToIssueObject(issue);
    });
    allIssueObjects = allIssueObjects.concat(
      parsedPastIssues,
      parsedCurrentIssues
    );

    // save issues and tracked practice if they don't exist in the database
    // if they do exist, update the object
    for (const issue of allIssueObjects) {
      let foundIssue = await IssueObjectModel.findOne({
        title: issue.title,
        project: issue.project,
        sig: issue.sig
      });
      if (!foundIssue) {
        await new IssueObjectModel(issue).save();
      } else {
        // check if the current issue has a newer timestamp than the older one
        if (issue.lastUpdated > foundIssue.lastUpdated) {
          await IssueObjectModel.findOneAndUpdate(
            {
              title: issue.title,
              project: issue.project,
              sig: issue.sig
            },
            issue,
            { upsert: true }
          );
        }
      }
    }

    // now we have to go back and update all trackedPractices with prevIssues
    for (const practice of trackedPractices) {
      // get the corresponding fixture
      let parsedPractice = fixture.trackedPractices.find((trackedPractice) => {
        return (
          htmlToText(trackedPractice.title).trim() ===
          htmlToText(practice.title).trim()
        );
      });

      if (parsedPractice !== undefined) {
        // get any issues that are in the prevIssues array
        let prevIssueTitles = parsedPractice.prevIssues.map((prevIssue) => {
          if (prevIssue !== undefined) {
            return htmlToText(prevIssue.title).trim();
          }
        });

        for (const prevIssueTitle of prevIssueTitles) {
          let issueId = await IssueObjectModel.findOne({
            title: prevIssueTitle,
            project: fixture.project,
            sig: fixture.sigName
          });
          if (issueId) {
            await PracticeGapObjectModel.findOneAndUpdate(
              {
                title: practice.title,
                sig: practice.sig,
                project: practice.project
              },
              { $push: { prevIssues: issueId } },
              { upsert: true }
            );
          }
        }
      }
    }

    // get the past issues and current issues from the database
    let pastIssues = await IssueObjectModel.find({
      title: { $in: parsedPastIssues.map((issue) => issue.title) },
      project: fixture.project,
      sig: fixture.sigName
    });
    let currentIssues = await IssueObjectModel.find({
      title: { $in: parsedCurrentIssues.map((issue) => issue.title) },
      project: fixture.project,
      sig: fixture.sigName
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
    newCAPNote.trackedPractices = trackedPractices
      .filter((practice) => {
        return parsedTrackedPractice.find((parsedPractice) => {
          return practice.title === parsedPractice.title;
        });
      })
      .map((practice) => {
        return practice._id;
      });

    // add the new CAP note to the parsed fixtures array
    parsedFixtures.push(newCAPNote);
  }

  await dbConnect();
  return await CAPNoteModel.insertMany(parsedFixtures);
};
