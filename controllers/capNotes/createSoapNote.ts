import mongoose from 'mongoose';
import dbConnect from '../../lib/dbConnect';
import CAPNoteModel from '../../models/CAPNoteModel';

/**
 * Create a new CAP note given the project and date of the note.
 * @param projectName
 * @param noteDate
 */
export const createCAPNote = async (projectName: string, noteDate: Date) => {
  try {
    // get proj and sig info
    const projInfoRes = await fetch(
      `${process.env.STUDIO_API}/projects/byName?${new URLSearchParams({
        populateTools: 'false',
        projectName: projectName
      })}`
    );
    let projInfo = await projInfoRes.json();

    const socialStructuresRes = await fetch(
      `${process.env.STUDIO_API}/socialStructures`
    );
    let socialStructuresInfo = await socialStructuresRes.json();

    // parse out sigName and sigAbbreviation
    let sigName = projInfo.sig_name;
    let sigAbbreviation = socialStructuresInfo.find(
      (socialStructure) =>
        socialStructure.name === sigName &&
        socialStructure.kind === 'SigStructure'
    ).abbreviation;

    // get the previous CAP note for the project
    await dbConnect();
    const previousCAPNotes = await CAPNoteModel.find({
      project: projectName,
      sigName: sigName
    }).sort({ date: -1 });
    const previousCAPNote = previousCAPNotes[0];

    // get practices from the prior CAP note
    let practices = [];
    if (previousCAPNote) {
      practices = previousCAPNote.trackedPractices;

      // for each issue, add the currentInstance to the top of the priorInstances list (if not null) and set currentInstance to null
      practices = practices.map((practice) => {
        if (practice.currentInstance) {
          // check if all practice fields are empty before adding to prior instances
          let someFieldPopulated =
            practice.currentInstance.context.some((contextEntry) => {
              contextEntry.value.trim() !== '';
            }) &&
            practice.currentInstance.assessment.some((assessmentEntry) => {
              assessmentEntry.value.trim() !== '';
            }) &&
            practice.currentInstance.plan.some((planEntry) => {
              planEntry.value.trim() !== '';
            });

          if (someFieldPopulated) {
            practice.priorInstances.unshift(practice.currentInstance);
          }

          // reset the current instance
          practice.currentInstance = null;
        }
        return practice;
      });
    }

    // save the new SOAP note to the database
    await dbConnect();
    return await CAPNoteModel.create({
      project: projectName,
      date: noteDate,
      lastUpdated: noteDate,
      sigName: sigName,
      sigAbbreviation: sigAbbreviation,
      context: [
        {
          id: new mongoose.Types.ObjectId().toString(),
          type: 'note',
          context: [],
          value: ''
        }
      ],
      assessment: [
        {
          id: new mongoose.Types.ObjectId().toString(),
          type: 'note',
          context: [],
          value: ''
        }
      ],
      plan: [
        {
          id: new mongoose.Types.ObjectId().toString(),
          type: 'note',
          context: [],
          value: ''
        }
      ],
      trackedPractices: practices,
      currIssueInstances: []
    });
  } catch (err) {
    console.error('Error in creating CAP note: ', err, err.stack);
    return null;
  }
};
