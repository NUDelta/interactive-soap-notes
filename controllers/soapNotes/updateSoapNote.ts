import dbConnect from '../../lib/dbConnect';
import SOAPModel, { SOAP } from '../../models/SOAPModel';

export const updateSOAPNote = async (id: string, soapNote: object) => {
  let soapNoteUpdatedContent = parseSoapNotes(soapNote);

  await dbConnect();
  return await SOAPModel.findByIdAndUpdate(id, soapNoteUpdatedContent, {
    new: true,
    runValidators: true,
  });
};

const parseSoapNotes = (soapNote: object) => {
  // create a new soap note object to hold everything
  let newSoapNote: SOAP = {
    date: soapNote['date'],
    lastUpdated: new Date(),
    sigName: soapNote['sigName'],
    sigAbbreviation: soapNote['sigAbbreviation'],
    subjective: soapNote['subjective'],
    objective: soapNote['objective'],
    assessment: soapNote['assessment'],
    plan: soapNote['plan'],
    priorContext: [],
    notedAssessments: [],
    followUpContext: [],
  };

  // parse out noted assessments
  let currAssessments = soapNote['assessment'].split('\n');
  let notedAssessments = currAssessments.filter((assessment) => {
    return assessment.includes('#');
  });
  newSoapNote.notedAssessments = notedAssessments;

  // parse out follow up context
  let currFollowups = soapNote['plan'].split('\n');
  let followUpContext = currFollowups.filter((followup) => {
    return followup.includes('[script]');
  });
  newSoapNote.followUpContext = followUpContext.map((followup) => {
    return parseScriptFollowups(followup);
  });

  return newSoapNote;
};

const parseScriptFollowups = (scriptText: string) => {
  // remove the [script] tag
  let cleanedScriptText = scriptText.replace('[script]', '').trim();
  console.log(cleanedScriptText);

  // match script text to existing scripts
  let outputScript = {
    target: {
      type: '',
      value: '',
    },
    opportunity: '',
    message: '',
  };
  let scriptMessage = '';
  if (cleanedScriptText.includes('at office hours')) {
    outputScript.opportunity = "this.venues.find('Office Hours')";
    scriptMessage = cleanedScriptText.replace('at office hours,', '');
  } else if (cleanedScriptText.includes('at studio')) {
    outputScript.opportunity = "this.venues.find('Studio')";
    scriptMessage = cleanedScriptText.replace('at studio,', '');
  } else if (cleanedScriptText.includes('morning of office hours')) {
    outputScript.opportunity =
      "this.morningOf(this.venues.find('Office Hours'))";
    scriptMessage = cleanedScriptText.replace('morning of office hours,', '');
  } else if (cleanedScriptText.includes('morning of studio')) {
    outputScript.opportunity = "this.morningOf(this.venues.find('Studio'))";
    scriptMessage = cleanedScriptText.replace('morning of studio,', '');
  }

  // TOOD: populate properly
  outputScript.target = {
    type: 'project',
    value: 'Orchestration Scripting Environments',
  };
  outputScript.message = scriptMessage.trim();

  return outputScript;
};
