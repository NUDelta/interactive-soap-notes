import dbConnect from '../../lib/dbConnect';
import SOAPModel from '../SOAPModel';

// TODO: these should be for PROJECTS not SIGs (sigs are composed of projects for which there each has a set of SOAP
const soapNotesForSigs = [
  {
    name: 'Networked Orchestration Technologies',
    abbreviation: 'NOT',
    soapNotes: [
      {
        project: 'Orchestration Scripting Environments',
        date: new Date('2023-10-24T00:00:00'),
        lastUpdated: new Date('2023-10-24T00:00:00'),
        subjective: 'Subjective 1',
        objective: 'Objective 2',
        assessment: 'Assessment 3',
        plan: 'Plan 4',
        priorContext: {},
        followUpContext: {},
      },
      {
        project: 'Situated Reflection Systems',
        date: new Date('2023-10-24T00:00:00'),
        lastUpdated: new Date('2023-10-24T00:00:00'),
        subjective: 'Subjective',
        objective: 'Objective',
        assessment: 'Assessment',
        plan: 'Plan',
        priorContext: {},
        followUpContext: {},
      },
    ],
  },
  //   {
  //     name: 'Opportunistic Collective Experiences',
  //     abbreviation: 'OCE',
  //     soapNotes: [
  //       {
  //         date: '2023-05-10',
  //         lastUpdated: '2023-05-10 15:00:00',
  //       },
  //       {
  //         date: '2023-05-03',
  //         lastUpdated: '2023-05-10 15:15:00',
  //       },
  //     ],
  //   },
  //   {
  //     name: 'Readily Available Learning Environments',
  //     abbreviation: 'RALE',
  //     soapNotes: [
  //       {
  //         date: '2023-05-08',
  //         lastUpdated: '2023-05-08 16:00:00',
  //       },
  //       {
  //         date: '2023-05-01',
  //         lastUpdated: '2023-05-01 16:30:00',
  //       },
  //     ],
  //   },
  //   {
  //     name: 'Context-Aware Metacognitive Practices',
  //     abbreviation: 'CAMP',
  //     soapNotes: [
  //       {
  //         date: '2023-05-12',
  //         lastUpdated: '2023-05-12 11:45:00',
  //       },
  //       {
  //         date: '2023-05-05',
  //         lastUpdated: '2023-05-12 11:45:00',
  //       },
  //     ],
  //   },
  //   {
  //     name: 'Human-AI Tools',
  //     abbreviation: 'HAT',
  //     soapNotes: [
  //       {
  //         date: '2023-05-10',
  //         lastUpdated: '2023-05-10 16:00:00',
  //       },
  //       {
  //         date: '2023-05-03',
  //         lastUpdated: '2023-05-10 16:15:00',
  //       },
  //     ],
  //   },
];

export const createSoapNoteFixtures = async () => {
  try {
    // Connect to MongoDB
    await dbConnect();

    // clear existing soap notes
    await SOAPModel.deleteMany({});

    // Create a soap note object for each sig in the fixtures
    let soapNotes = [];
    soapNotesForSigs.map((sig) => {
      sig.soapNotes.map((soapNote) => {
        soapNotes.push({
          sigName: sig.name,
          sigAbbreviation: sig.abbreviation,
          project: soapNote.project,
          date: soapNote.date,
          lastUpdated: soapNote.lastUpdated,
          subjective: soapNote.subjective,
          objective: soapNote.objective,
          assessment: soapNote.assessment,
          plan: soapNote.plan,
          priorContext: [],
          notedAssessments: [],
          followUpContext: [],
        });
      });
    });

    return await SOAPModel.insertMany(soapNotes);
  } catch (error) {
    console.log(error);
  }
};
