import dbConnect from '../../lib/dbConnect';
import SOAPModel from '../SOAPModel';

// TODO: 03-03-24 -- create fixtures such that createSOAPNote can be used
const soapNotesForSigs = [
  {
    name: 'Networked Orchestration Technologies',
    abbreviation: 'NOT',
    soapNotes: [
      {
        project: 'Orchestration Scripting Environments',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      }
    ]
  },
  {
    name: 'Human-AI Tools (Difference)',
    abbreviation: 'HAT-D',
    soapNotes: [
      {
        project: 'Human-AI Tools for Accounting for Differences',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      },
      {
        project: 'Reference Systems',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      }
    ]
  },
  {
    name: 'Human-AI Tools (Expression)',
    abbreviation: 'HAT-X',
    soapNotes: [
      {
        project: 'Human-AI Tools for Concept Expression',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      },
      {
        project:
          'Human-AI Tools for Aligning to Machine Representations and Execution',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      }
    ]
  },
  {
    name: 'Breaking Boundaries',
    abbreviation: 'BB',
    soapNotes: [
      {
        project: 'How Can Computers Support Dialectical Activities?',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      },
      {
        project: 'Prototyping with LLMs',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      }
    ]
  },
  {
    name: 'Contextually-Aware Metacognitive Practice',
    abbreviation: 'CAMP',
    soapNotes: [
      {
        project: 'Q&A Buddy',
        date: new Date('2024-02-14T06:00:00'),
        lastUpdated: new Date('2024-02-14T06:00:00'),
        issues: [],
        priorContext: {},
        followUpContext: {}
      },
      {
        project: 'PATH',
        date: new Date('2024-02-14T06:00:00'),
        lastUpdated: new Date('2024-02-14T06:00:00'),
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        priorContext: {},
        followUpContext: {}
      }
    ]
  }
];

export const createSoapNoteFixtures = async () => {
  try {
    // Connect to MongoDB
    await dbConnect();

    // clear existing soap notes
    await SOAPModel.deleteMany({});

    // Create a soap note object for each sig in the fixtures
    // TODO: 03-03-24 -- use createSOAPNote to create the soap notes
    let soapNotes = [];
    soapNotesForSigs.map((sig) => {
      sig.soapNotes.map((soapNote) => {
        soapNotes.push({
          sigName: sig.name,
          sigAbbreviation: sig.abbreviation,
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          project: soapNote.project,
          date: soapNote.date,
          lastUpdated: soapNote.lastUpdated,
          issues: soapNote.issues,
          priorContext: [],
          notedAssessments: [],
          followUpContext: []
        });
      });
    });

    return await SOAPModel.insertMany(soapNotes);
  } catch (error) {
    console.log(error);
  }
};
