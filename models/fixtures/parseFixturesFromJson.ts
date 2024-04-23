import mongoose from 'mongoose';
import CAPNoteModel, { CAPStruct } from '../CAPNoteModel';
import dbConnect from '../../lib/dbConnect';

export const parseFixturesFromJson = async (fixtures) => {
  // create an array to hold the parsed fixtures
  let parsedFixtures = [];

  // loop through the fixtures and parse them
  fixtures.forEach((fixture) => {
    // create a new CAP note object to hold everything
    let newCAPNote = new CAPNoteModel({
      project: fixture.project,
      date: new Date(Number(fixture.date['$date']['$numberLong'])),
      lastUpdated: new Date(
        Number(fixture.lastUpdated['$date']['$numberLong'])
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
              date: new Date(
                Number(practice.currentInstance.date['$date']['$numberLong'])
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
              followUps: []
            };

      trackedPractices.push({
        id: new mongoose.Types.ObjectId().toString(),
        title: practice.title,
        description: practice.description,
        lastUpdated: new Date(
          Number(practice.lastUpdated['$date']['$numberLong'])
        ),
        practiceInactive: practice.practiceInactive,
        practiceArchived: practice.practiceArchived,
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
