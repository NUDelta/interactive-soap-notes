import crypto from 'crypto';

function createPostSigMessage(noteId, projName, practiceAgents, orgObjs) {
  // TODO: this should be the date of THE SIG, not the current date -- otherwise, it'll recreate the issue unnecessarily
  let currDate = new Date();
  let weekFromCurrDate = new Date(currDate.getTime());
  weekFromCurrDate.setDate(weekFromCurrDate.getDate() + 7);
  let timezone = 'America/Chicago';

  let newActiveIssue = {
    scriptId: crypto
      .createHash('md5')
      .update(`${noteId}-post-sig`)
      .digest('hex')
      .slice(0, 24),
    scriptName: `plan follow-up after SIG for ${projName}`,
    dateTriggered: currDate,
    expiryTime: weekFromCurrDate,
    shouldRepeat: false,
    issueTarget: {
      targetType: 'project',
      name: projName
    },
    strategyToEnact: {
      name: `plan follow-up after SIG for ${projName}`,
      description: '',
      strategy_function: ''
    },
    updateIfExists: true // used to update an already created active issue
  };

  // build up strategy message by looping over practice agents
  let strategy =
    "Here's some practices for you to work on from SIG meeting.\\n\\n";
  for (let issueKey in practiceAgents) {
    let currentContent = `> ${issueKey}`;

    // sort practice agents by practice
    // from: https://stackoverflow.com/a/14872766
    let ordering = {};
    let sortOrder = ['plan', 'self-work', 'help', 'reflect'];
    for (var i = 0; i < sortOrder.length; i++) ordering[sortOrder[i]] = i;
    practiceAgents[issueKey].sort(
      (a, b) =>
        ordering[a.practice.match(/\[(.*?)\]\s*(.*)/).slice(1)[0]] -
          ordering[b.practice.match(/\[(.*?)\]\s*(.*)/).slice(1)[0]] ||
        a.followUpObject.parsedPractice.practice.localeCompare(
          b.followUpObject.parsedPractice.practice
        )
    );

    // add practice content for each practice agent
    for (let practiceAgent of practiceAgents[issueKey]) {
      currentContent += `\\n- ${practiceAgent.followUpObject.parsedPractice.practice}`;
    }
    strategy += currentContent + '\\n\\n';
  }
  strategy +=
    '---\\n' +
    "Let your mentor know if you have any challenges in doing these practices. I'll remind you about opportunities to practice later in the week (e.g., mysore, pair research).";
  strategy = strategy.replace(/[\""]/g, '\\"');

  // create the function to actually deliver the message
  let strategyFunction = async function () {
    return await this.messagePeople({
      message: strategyTextToReplace,
      people: peopleToMessage,
      opportunity: async function () {
        return await this.thisAfternoon('currDate', 'timezone');
      }.toString()
    });
  }.toString();

  console.log(strategyFunction);

  strategyFunction = strategyFunction.replace(
    'currDate',
    currDate.toUTCString()
  );
  strategyFunction = strategyFunction.replace('timezone', timezone);

  // TODO: REMOVE HARD CODING
  strategyFunction = strategyFunction.replace(
    'peopleToMessage',
    `[${orgObjs.project.students.map((student) => `"${student.name}"`).join(',')}, "Kapil Garg"]`
  );
  strategyFunction = strategyFunction.replace(
    'strategyTextToReplace',
    '"' + strategy + '"'
  );

  // add to newActiveIssue and return
  newActiveIssue.strategyToEnact.strategy_function = strategyFunction;
  return newActiveIssue;
}

/**
 * Creates reflection questions for student to do after a plan.
 * @param plan
 * @returns
 */
// TODO: this should compute two sets of refection questions: for if you did and if you didn't do the reflection
const computeReflectionQuestions = (plan) => {
  // get reflection questions based on the plan entry
  let reflectionQuestions = [];
  if (plan.value.includes('[plan]')) {
    reflectionQuestions = [];
  } else if (plan.value.includes('[reflect]')) {
    {
      reflectionQuestions = [
        {
          prompt: 'Enter your reflections on the above, based on this week.',
          responseType: 'string'
        },
        {
          prompt:
            'In general: did this reflection help you see your practices and understand why they happen? What was helpful? What obstacles do you still have?',
          responseType: 'string'
        }
      ];
    }
  } else if (plan.value.includes('[self-work]')) {
    reflectionQuestions = [
      {
        prompt: 'Did you do the work practice your mentor suggested?',
        responseType: 'boolean'
      },
      {
        prompt:
          'Share a link to any deliverable that shows what you worked on. Make sure it is accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        responseType: 'string'
      },
      {
        prompt:
          'How did your understanding change? What new risk(s) do you see?',
        responseType: 'string'
      },
      {
        prompt: 'What obstacles came up in trying to do it, if any?',
        responseType: 'string'
      }
    ];
  } else if (plan.value.includes('[help]')) {
    reflectionQuestions = [
      {
        prompt:
          'Did you do the help-seeking interaction your mentor suggested?',
        responseType: 'boolean'
      },
      {
        prompt:
          'Share a link to any deliverable that shows what you worked on. Make sure it is accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        responseType: 'string'
      },
      {
        prompt:
          'What did it help you learn or progress?  What new risk(s) do you see?',
        responseType: 'string'
      },
      {
        prompt:
          'What obstacles came up in trying to do it, if any? Were you unable to do the help-seeking interaction suggested (and if so, why not)?',
        responseType: 'string'
      }
    ];
  }

  return reflectionQuestions;
};

// TODO: include Plan text that doesn't have an agent tag associated with it BUT not messages that don't have anything OR have an agent tag without the agent info
const parsePracticeText = (practice) => {
  // split the practice text into [practice] and content
  let [practiceTag, content] = practice.match(/\[(.*?)\]\s*(.*)/).slice(1);

  // create the parsed practice based on the practice tag
  let parsedPractice = '';
  switch (practiceTag) {
    case 'plan':
      parsedPractice =
        'Update your <${this.project.tools.sprintLog.url}|Sprint Log>: ';
      break;
    case 'reflect':
      parsedPractice = 'Reflect on your own: ';
      break;
    case 'self-work':
      parsedPractice = 'On your own, try to: ';
      break;
    case 'help':
      // check if content contains @mysore
      if (content.toLowerCase().includes('@mysore')) {
        parsedPractice = 'At Mysore: ';
        content = content.replace(/@mysore/gi, 'Mysore');
      } else if (content.toLowerCase().includes('@pair research')) {
        parsedPractice = 'At Pair Research: ';
        content = content.replace(/@pair research/gi, 'Pair Research');
      } else {
        parsedPractice = 'Help seek: '; // TODO: allow for including people
      }
      break;
    default:
      break;
  }

  // combine with content and return
  return parsedPractice + content;
};
