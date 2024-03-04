import dbConnect from '../../lib/dbConnect';
import SOAPModel from '../../models/SOAPModel';

/**
 * Create a new SOAP note given the project and date of the note.
 * @param projectName
 * @param noteDate
 */
export const createSOAPNote = async (projectName: string, noteDate: Date) => {
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

    // get the previous SOAP note for the project
    await dbConnect();
    const previousSoapNotes = await SOAPModel.find({
      project: projectName,
      sigName: sigName
    }).sort({ date: -1 });
    const previousSoapNote = previousSoapNotes[0];

    // get issues from the prior soap note
    let issues = [];
    if (previousSoapNote) {
      issues = previousSoapNote.issues;

      // for each issue, add the currentInstance to the top of the priorInstances list (if not null) and set currentInstance to null
      issues = issues.map((issue) => {
        if (issue.currentInstance) {
          issue.priorInstances.unshift(issue.currentInstance);
          issue.currentInstance = null;
        }
        return issue;
      });
    }

    // save the new SOAP note to the database
    await dbConnect();
    return await SOAPModel.create({
      project: projectName,
      date: noteDate,
      lastUpdated: noteDate,
      sigName: sigName,
      sigAbbreviation: sigAbbreviation,
      subjective: [],
      objective: [],
      assessment: [],
      plan: [],
      issues: issues
    });
  } catch (err) {
    console.error('Error in creating SOAP note: ', err, err.stack);
    return null;
  }
};
