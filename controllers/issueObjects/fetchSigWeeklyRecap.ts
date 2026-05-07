import dbConnect from '../../lib/dbConnect';
import IssueObjectModel from '../../models/IssueObjectModel';

interface FollowUpSummary {
  practice: string;
  didHappen: boolean | null;
  deliverableLink: string | null;
  deliverableNotes: string | null;
  reflections: { prompt: string; response: string }[];
}

interface PersonFollowUps {
  person: string;
  followUps: FollowUpSummary[];
}

export interface ProjectRecap {
  projectName: string;
  byPerson: PersonFollowUps[];
}

export const fetchSigWeeklyRecap = async (
  sigName: string,
  weekStart: Date
): Promise<ProjectRecap[]> => {
  await dbConnect();

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const issues = await IssueObjectModel.find({
    sig: sigName,
    date: { $gte: weekStart, $lt: weekEnd },
    wasDeleted: { $ne: true },
  }).sort({ project: 1 });

  const projectMap = new Map<string, Map<string, FollowUpSummary[]>>();

  for (const issue of issues) {
    if (!projectMap.has(issue.project)) {
      projectMap.set(issue.project, new Map());
    }
    const personMap = projectMap.get(issue.project)!;

    for (const fu of issue.followUps) {
      const person = fu.parsedPractice?.person || 'Unknown';
      if (!personMap.has(person)) {
        personMap.set(person, []);
      }

      const didHappen: boolean | null = fu.outcome?.didHappen ?? null;
      const reflectionIndex = didHappen === true ? 1 : 0;
      const reflectionArray = fu.outcome?.reflections?.[reflectionIndex] ?? [];

      personMap.get(person)!.push({
        practice: fu.parsedPractice?.practice || fu.practice,
        didHappen,
        deliverableLink: fu.outcome?.deliverableLink ?? null,
        deliverableNotes: fu.outcome?.deliverableNotes ?? null,
        reflections: reflectionArray
          .filter((r: any) => r.response)
          .map((r: any) => ({ prompt: r.prompt, response: r.response })),
      });
    }
  }

  return Array.from(projectMap.entries()).map(([projectName, personMap]) => ({
    projectName,
    byPerson: Array.from(personMap.entries()).map(([person, followUps]) => ({
      person,
      followUps,
    })),
  }));
};
