import dbConnect from '../../lib/dbConnect';
import SOAPModel from '../../models/SOAPModel';

/**
 * Create a new SOAP note given the project and date of the note.
 * @param projectName
 * @param noteDate
 */
export const createSOAPNote = async (projectName: string, noteDate: Date) => {
  // TODO: 03-03-24 -- when creating SOAP note, use accumulation to get the list of issues from prior weeks. check to see if the prior week exists before adding it to the list
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
      issues: []
    });
  } catch (err) {
    console.error('Error in creating SOAP note: ', err, err.stack);
    return null;
  }
};
