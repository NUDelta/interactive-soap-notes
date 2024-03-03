import dbConnect from '../../lib/dbConnect';
import SOAPModel from '../SOAPModel';

const soapNotesForSigs = [
  {
    name: 'Networked Orchestration Technologies',
    abbreviation: 'NOT',
    soapNotes: [
      {
        project: 'Orchestration Scripting Environments',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        subjective: [
          {
            isChecked: false,
            isInIssue: false,
            type: 'note',
            context: [],
            value: 'I feel like I am making progress on the project.'
          },
          {
            isChecked: false,
            isInIssue: false,
            type: 'note',
            context: [],
            value: 'I am tired'
          }
        ],
        objective: [
          {
            isChecked: false,
            isInIssue: false,
            type: 'note',
            context: [],
            value: 'I am making progress on the project.'
          }
        ],
        assessment: [
          {
            isChecked: false,
            isInIssue: false,
            type: 'note',
            context: [],
            value: 'I feel like I am making progress on the project.'
          }
        ],
        plan: [],
        issues: [
          {
            title: 'burning out',
            description:
              "studnet has been working really hard, and I'm worried they'll burn out",
            currentInstance: null,
            priorInstances: [
              {
                date: new Date('2024-02-05T06:00:00'),
                context: 'I feel tired',
                summary: 'student is worn out'
              }
            ],
            lastEdited: new Date('2024-02-05T06:00:00'),
            issueInactive: false,
            issueArchived: false
          },
          {
            title: 'making progress',
            description: 'student is making progress on the project',
            currentInstance: null,
            priorInstances: [],
            lastEdited: new Date('2024-02-12T06:00:00'),
            issueInactive: false,
            issueArchived: false
          }
        ]
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
        issues: []
      },
      {
        project: 'Reference Systems',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: []
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
        issues: []
      },
      {
        project:
          'Human-AI Tools for Aligning to Machine Representations and Execution',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: []
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
        issues: []
      },
      {
        project: 'Prototyping with LLMs',
        date: new Date('2024-02-12T06:00:00'),
        lastUpdated: new Date('2024-02-12T06:00:00'),
        issues: []
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
        issues: []
      },
      {
        project: 'PATH',
        date: new Date('2024-02-14T06:00:00'),
        lastUpdated: new Date('2024-02-14T06:00:00'),
        issues: []
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
    let soapNotes = [];
    soapNotesForSigs.map((sig) => {
      sig.soapNotes.map((soapNote) => {
        soapNotes.push({
          project: soapNote.project,
          date: soapNote.date,
          lastUpdated: soapNote.lastUpdated,
          sigName: sig.name,
          sigAbbreviation: sig.abbreviation,
          subjective: soapNote.subjective ?? [],
          objective: soapNote.objective ?? [],
          assessment: soapNote.assessment ?? [],
          plan: soapNote.plan ?? [],
          issues: soapNote.issues ?? []
        });
      });
    });

    return await SOAPModel.insertMany(soapNotes);
  } catch (error) {
    console.log(error);
  }
};
