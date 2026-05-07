import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import dbConnect from '../../../lib/dbConnect';
import CAPNoteModel from '../../../models/CAPNoteModel';
import IssueObjectModel from '../../../models/IssueObjectModel';
import PracticeGapObjectModel from '../../../models/PracticeGapObjectModel';

const PAPER_CONTEXT = fs.readFileSync(
  path.join(process.cwd(), 'pages/api/ai-draft/papercontext.txt'),
  'utf-8'
);

const SYSTEM_PROMPT = `You are helping a research coach support students in acting on practices suggested after a SIG meeting.

For each practice a coach has assigned, you will write:
1. A VALUE STATEMENT: 2-3 sentences addressed directly to the student (use "you"). Explain why this specific practice matters for their development based on what the coach observed. Reference the student's specific patterns if prior history is available. Write in the coach's warm, direct voice — honest about the gap, affirming about the student's capacity.
2. INTERVENTIONS: 2-3 concrete, low-stakes starting points (each ~15-30 minutes) for if the student is stuck. These are optional scaffolding — "ways in" — not additional homework. Make them specific to the issue content, not generic. Match the practice type:
   - [self-work]: micro-versions of the main task (e.g., "spend 15 minutes writing just the first paragraph of X")
   - [help]: how to prepare/frame the help-request before the venue
   - [reflect]: specific 5-minute journaling prompts to start the reflection
   - [plan]: the one concrete first thing to update in the sprint log

## Regulation Framework
${PAPER_CONTEXT}

## Output Format

Return JSON only — no markdown wrapping:
{
  "practices": [
    {
      "issueId": "the issueId provided",
      "followUpIndex": 0,
      "valueStatement": "You've been...",
      "interventions": ["Try this...", "Or this...", "If you want to go further..."]
    }
  ]
}`;

type PracticeSupportResponse = {
  success: boolean;
  data?: { issueId: string; followUpIndex: number; valueStatement: string; interventions: string[] }[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PracticeSupportResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { noteId } = req.body;
  if (!noteId || typeof noteId !== 'string') {
    return res.status(400).json({ success: false, error: 'noteId is required' });
  }

  const apiKey = process.env.CHATGPT_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'CHATGPT_API_KEY is not configured' });
  }

  await dbConnect();

  const capNote = await CAPNoteModel.findById(noteId).populate({
    path: 'currentIssues',
    model: IssueObjectModel
  });

  if (!capNote) {
    return res.status(404).json({ success: false, error: 'CAP note not found' });
  }

  const currentIssues: any[] = capNote.currentIssues ?? [];
  const activeIssues = currentIssues.filter((i: any) => !i.wasDeleted && !i.wasMerged);

  // Build all follow-ups that need practice support
  const followUpEntries: {
    issueId: string;
    issueTitle: string;
    issueAssessment: string;
    issueContext: string;
    followUpIndex: number;
    practice: string;
    priorHistory: string;
  }[] = [];

  // Fetch prior instances for all issues in parallel
  const priorInstancesMap: Record<string, any[]> = {};
  await Promise.all(
    activeIssues.map(async (issue: any) => {
      if (!issue.priorInstances?.length) return;
      const priors = await IssueObjectModel.find({
        _id: { $in: issue.priorInstances.slice(-3) }
      }).sort({ date: -1 });
      priorInstancesMap[issue._id.toString()] = priors;
    })
  );

  const activeGaps = await PracticeGapObjectModel.find({
    project: capNote.project,
    practiceArchived: false
  }).sort({ lastUpdated: -1 });

  for (const issue of activeIssues) {
    const issueId = issue._id.toString();
    const assessmentText = (issue.assessment ?? []).map((a: any) => a.value).filter(Boolean).join('\n');
    const contextText = (issue.context ?? []).map((c: any) => c.value).filter(Boolean).join('\n');

    // Build prior history string for this issue
    const priors = priorInstancesMap[issueId] ?? [];
    let priorHistory = '';
    if (priors.length > 0) {
      priorHistory = priors.map((prior: any, idx: number) => {
        const priorAssessment = (prior.assessment ?? []).map((a: any) => a.value).filter(Boolean).join('\n');
        const reflectionSummaries: string[] = [];
        for (const fu of prior.followUps ?? []) {
          const didHappen = fu.outcome?.didHappen;
          if (didHappen === null) continue;
          const reflectionSet = fu.outcome?.reflections?.[didHappen ? 1 : 0] ?? [];
          const responses = reflectionSet
            .filter((r: any) => r.response?.trim())
            .map((r: any) => `  Q: ${r.prompt}\n  A: ${r.response}`);
          if (responses.length) {
            reflectionSummaries.push(`Practice: ${fu.parsedPractice?.practice ?? fu.practice}\nDid it happen: ${didHappen ? 'yes' : 'no'}\n${responses.join('\n')}`);
          }
        }
        return `Prior instance ${idx + 1}:\nAssessment: ${priorAssessment}${reflectionSummaries.length ? '\nPast reflections:\n' + reflectionSummaries.join('\n\n') : ''}`;
      }).join('\n\n---\n\n');
    }

    for (let followUpIndex = 0; followUpIndex < (issue.followUps ?? []).length; followUpIndex++) {
      const followUp = issue.followUps[followUpIndex];
      // Skip [plan] follow-ups — no reflection needed, so no student-facing support needed
      if (followUp.practice.includes('[plan]')) continue;
      followUpEntries.push({
        issueId,
        issueTitle: issue.title,
        issueAssessment: assessmentText,
        issueContext: contextText,
        followUpIndex,
        practice: followUp.parsedPractice?.practice ?? followUp.practice,
        priorHistory
      });
    }
  }

  if (followUpEntries.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  const practiceGapsText = activeGaps.length
    ? activeGaps.map((g: any) => `- ${g.title}: ${g.description}`).join('\n')
    : '';

  let userMessage = `Generate value statements and interventions for the following practices assigned after a SIG meeting.\n\n`;
  userMessage += `Project: ${capNote.project}\n\n`;

  if (practiceGapsText) {
    userMessage += `## Tracked Practice Gaps\n${practiceGapsText}\n\n`;
  }

  userMessage += `## Practices Needing Support\n\n`;
  for (const entry of followUpEntries) {
    userMessage += `### Issue: "${entry.issueTitle}"\n`;
    userMessage += `issueId: ${entry.issueId}\nfollowUpIndex: ${entry.followUpIndex}\n\n`;
    userMessage += `Coach's context:\n${entry.issueContext}\n\n`;
    userMessage += `Coach's assessment:\n${entry.issueAssessment}\n\n`;
    userMessage += `Practice assigned: ${entry.practice}\n\n`;
    if (entry.priorHistory) {
      userMessage += `Prior history for this issue:\n${entry.priorHistory}\n\n`;
    }
    userMessage += `---\n\n`;
  }

  userMessage += `Return a JSON object with a "practices" array. Include one entry per practice above, using the issueId and followUpIndex exactly as provided.`;

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const rawText = completion.choices[0]?.message?.content ?? '{}';
    let parsed: { practices: { issueId: string; followUpIndex: number; valueStatement: string; interventions: string[] }[] };

    try {
      const raw = JSON.parse(rawText);
      parsed = {
        practices: Array.isArray(raw.practices)
          ? raw.practices.map((p: any) => ({
              issueId: String(p.issueId ?? ''),
              followUpIndex: Number(p.followUpIndex ?? 0),
              valueStatement: String(p.valueStatement ?? ''),
              interventions: Array.isArray(p.interventions) ? p.interventions.map(String) : []
            }))
          : []
      };
    } catch {
      return res.status(500).json({ success: false, error: 'Model returned invalid JSON' });
    }

    // Persist generated content to each FollowUp in DB
    for (const p of parsed.practices) {
      await IssueObjectModel.findByIdAndUpdate(
        p.issueId,
        {
          $set: {
            [`followUps.${p.followUpIndex}.valueStatement`]: p.valueStatement,
            [`followUps.${p.followUpIndex}.interventions`]: p.interventions
          }
        }
      );
    }

    return res.status(200).json({ success: true, data: parsed.practices });
  } catch (error) {
    console.error('Error generating practice support:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate practice support'
    });
  }
}
