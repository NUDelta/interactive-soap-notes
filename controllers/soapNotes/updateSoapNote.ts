import dbConnect from '../../lib/dbConnect';
import SOAPModel, { SOAPStruct } from '../../models/SOAPModel';

export const updateSOAPNote = async (id: string, soapNote: object) => {
  let soapNoteUpdatedContent = parseSoapNotes(soapNote);

  await dbConnect();
  return await SOAPModel.findByIdAndUpdate(id, soapNoteUpdatedContent, {
    new: true,
    runValidators: true
  });
};

const parseSoapNotes = (soapNote: object) => {
  // create a new soap note object to hold everything
  let updatedSoapNote = {
    project: soapNote['project'],
    date: soapNote['date'],
    lastUpdated: soapNote['lastUpdated'],
    sigName: soapNote['sigName'],
    sigAbbreviation: soapNote['sigAbbreviation'],
    subjective: soapNote['subjective'],
    objective: soapNote['objective'],
    assessment: soapNote['assessment'],
    plan: soapNote['plan'],
    issues: soapNote['issues']
  };

  // // parse out noted assessments
  // let notedAssessments = soapNote['issues']
  //   .map((issue) => {
  //     let currAssessments = issue['assessment'].split('\n');
  //     let notedAssessments = currAssessments.filter((assessment) => {
  //       return assessment.includes('#');
  //     });
  //     return notedAssessments;
  //   })
  //   .flat();
  // updatedSoapNote.notedAssessments = notedAssessments;

  // parse out follow up context from issues
  // let currFollowups = soapNote['issues']
  //   .map((issue) => {
  //     return issue['followUpPlans'];
  //   })
  //   .flat();

  // updatedSoapNote.followUpContext = currFollowups.map((followup) => {
  //   return parseScriptFollowups(followup, soapNote['project']);
  // });

  return updatedSoapNote;
};

// TODO: this is never used since the parsing is happening in pages/api/soap[id].ts
// create an interface
interface ScriptObj {
  venue: string;
  strategy: string;
}

const parseScriptFollowups = (scriptObj: ScriptObj, projectName: string) => {
  // match script text to existing scripts
  let outputScript = {
    target: {
      type: '',
      value: ''
    },
    opportunity: '',
    message: ''
  };
  let scriptMessage = '';
  if (scriptObj.venue.includes('at office hours')) {
    outputScript.opportunity =
      "this.venues.find(this.where('kind', 'OfficeHours'))";
    scriptMessage = scriptObj.venue.replace('at office hours:', '');
  } else if (scriptObj.venue.includes('at studio')) {
    outputScript.opportunity = "this.venues.find(this.where('kind', 'Studio'))";
    scriptMessage = scriptObj.venue.replace('at studio:', '');
  } else if (scriptObj.venue.includes('morning of office hours')) {
    outputScript.opportunity =
      "this.morningOf(this.venues.find(this.where('kind', 'OfficeHours')))";
    scriptMessage = scriptObj.venue.replace('morning of office hours:', '');
  } else if (scriptObj.venue.includes('morning of studio')) {
    outputScript.opportunity =
      "this.morningOf(this.venues.find(this.where('kind', 'Studio')))";
    scriptMessage = scriptObj.venue.replace('morning of studio:', '');
  } else if (scriptObj.venue.includes('day after SIG')) {
    outputScript.opportunity = 'this.daysAfter(new Date(), 1)';
    scriptMessage = scriptObj.venue.replace('day after SIG:', '');
  }

  // TOOD: populate properly
  outputScript.target = {
    type: 'project',
    value: projectName
  };
  outputScript.message = scriptMessage.trim();

  console.log(outputScript);
  return outputScript;
};
