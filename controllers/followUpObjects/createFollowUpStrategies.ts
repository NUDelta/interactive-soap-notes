import crypto from 'crypto';

export const createPostSigMessage = (
  noteId,
  projName,
  noteDate,
  practiceAgents,
  orgObjs
) => {
  let currDate = noteDate;
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
  strategyFunction = strategyFunction.replace(
    'peopleToMessage',
    `[${orgObjs.project.students.map((student) => `"${student.name}"`).join(',')}]`
  );
  strategyFunction = strategyFunction.replace(
    'strategyTextToReplace',
    '"' + strategy + '"'
  );

  // add to newActiveIssue and return
  newActiveIssue.strategyToEnact.strategy_function = strategyFunction;
  return newActiveIssue;
};

/**
 * Creates reflection questions for student to do after a plan.
 * @param plan
 * @returns
 */
// TODO: this should compute two sets of refection questions: for if you did and if you didn't do the reflection
export const computeReflectionQuestions = (parsedPractice) => {
  // get reflection questions based on the plan entry
  let reflectionQuestions = [];
  let questionsIfNotDone = [];
  let questionsIfDone = [];

  if (parsedPractice.practiceTag === 'plan') {
    // do nothing
  } else if (parsedPractice.practiceTag === 'reflect') {
    questionsIfDone = [
      {
        prompt:
          'Enter your reflections on the prompt your mentor suggested above.',
        responseType: 'string'
      },
      {
        prompt:
          'How did this reflection help you see how you currently practice and why that happens, and how your practices could change? What was helpful? What obstacles or concerns do you still have?',
        responseType: 'string'
      }
    ];
  } else if (parsedPractice.practiceTag === 'self-work') {
    questionsIfDone = [
      // {
      //   prompt:
      //     'Share a link to any deliverable that shows what you worked on. This can be a Google Doc, link to a prototype on Figma, code on Github, an image, etc. For images, upload to this folder and copy the file link below (Right Click → Share → Copy Link). Make all links you provide are accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
      //   responseType: 'string'
      // },
      // {
      //   prompt:
      //     'Describe your deliverable: what does it show, and what should the mentor look like?',
      //   responseType: 'string'
      // },
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

    questionsIfNotDone = [
      {
        prompt:
          "What prevented you from doing this work practice (e.g., didn't have time? Not important after addressing another risk?)? Why did this prevent you from doing it?",
        responseType: 'string'
      },
      {
        prompt:
          'Are there other strategies that you could have tried? For example, could your mentor or your peers have helped you? Why or why not?',
        responseType: 'string'
      }
    ];
  } else if (parsedPractice.practiceTag === 'help') {
    // check if at mysore
    if (parsedPractice.parsedPracticePrefix.includes('Mysore')) {
      questionsIfDone = [
        // {
        //   prompt:
        //     'Share a link to an image of what you worked on or discussed at Mysore. For images, upload to this folder and copy the file link below (Right Click → Share → Copy Link). Make all links you provide are accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        //   responseType: 'string'
        // },
        // {
        //   prompt:
        //     'Describe your deliverable: what does it show, and what should the mentor look like?',
        //   responseType: 'string'
        // },
        {
          prompt:
            'How did Mysore help progress your understanding? What new risk(s) did it reveal?',
          responseType: 'string'
        },
        {
          prompt: 'What obstacles came up during Mysore, if any?',
          responseType: 'string'
        }
      ];

      questionsIfNotDone = [
        {
          prompt:
            'Did anything prevent you from attending Mysore this week? If so, why?',
          responseType: 'string'
        },
        {
          prompt:
            'Did anything prevent you from working on the suggested practice at Mysore? If so, why?',
          responseType: 'string'
        }
      ];
    } else if (parsedPractice.parsedPracticePrefix.includes('Pair Research')) {
      questionsIfDone = [
        // {
        //   prompt:
        //     'Share a link to any deliverable that shows what you worked on during Pair Research. This can be a Google Doc, link to a prototype on Figma, code on Github, an image, etc. For images, upload to this folder and copy the file link below (Right Click → Share → Copy Link). Make all links you provide are accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        //   responseType: 'string'
        // },
        // {
        //   prompt:
        //     'Describe your deliverable: what does it show, and what should the mentor look like?',
        //   responseType: 'string'
        // },
        {
          prompt:
            'What did working with a peer help you accomplish? How did that help you progress your sprint?',
          responseType: 'string'
        },
        {
          prompt:
            'Were you able to complete your help-request? If not, what obstacles came up? For example, was the help-request not sliced enough?',
          responseType: 'string'
        }
      ];

      questionsIfNotDone = [
        {
          prompt:
            'Did anything prevent you from attending Pair Research this week? If so, why?',
          responseType: 'string'
        },
        {
          prompt:
            'Did anything prevent you from working on the suggested practice at Pair Research? If so, why? For example, did you activity to help plan a slice of a task that a peer could help with?',
          responseType: 'string'
        }
      ];
    } else if (parsedPractice.parsedPracticePrefix.includes('With')) {
      questionsIfDone = [
        // {
        //   prompt:
        //     'Share a link to any deliverable that shows what you worked on with the people your mentor suggested. This can be a Google Doc, link to a prototype on Figma, code on Github, an image, etc. For images, upload to this folder and copy the file link below (Right Click → Share → Copy Link). Make all links you provide are accessible to anyone (e.g., use “anyone with link” permission on Google Drive).',
        //   responseType: 'string'
        // },
        // {
        //   prompt:
        //     'Describe your deliverable: what does it show, and what should the mentor look like?',
        //   responseType: 'string'
        // },
        {
          prompt:
            'What did working with people your mentor suggested help you accomplish? How did that help you progress your sprint?',
          responseType: 'string'
        },
        {
          prompt:
            'Were you able to complete your help-request? If not, what obstacles came up? For example, did a new issue come while you were help-seeking?',
          responseType: 'string'
        }
      ];

      questionsIfNotDone = [
        {
          prompt:
            'Did anything prevent you from asking the people your mentor suggested for help? If so, why?',
          responseType: 'string'
        }
      ];
    }
  }

  return [questionsIfNotDone, questionsIfDone];
};

// TODO: include Plan text that doesn't have an agent tag associated with it BUT not messages that don't have anything OR have an agent tag without the agent info
export const parsePracticeText = (practice) => {
  // split the practice text into [practice] and content
  let [practiceTag, content] = practice.match(/\[(.*?)\]\s*(.*)/).slice(1);
  let output = {
    practiceTag: practiceTag,
    parsedPracticePrefix: '',
    content: content,
    opportunity: {},
    representations: []
  };

  // create the parsed practice based on the practice tag
  switch (practiceTag) {
    case 'plan':
      output.parsedPracticePrefix =
        'Update your <${this.project.tools.sprintLog.url}|Sprint Log>: ';
      break;
    case 'reflect':
      output.parsedPracticePrefix = 'Reflect on your own: ';
      break;
    case 'self-work':
      output.parsedPracticePrefix = 'On your own, try to: ';
      break;
    case 'help':
      // check if content contains @mysore
      if (output.content.toLowerCase().includes('at[mysore]')) {
        output.parsedPracticePrefix = 'At Mysore: ';
        output.content = output.content.replace(/at\[mysore\]/gi, 'Mysore');

        // update opportunity
        output.opportunity = {
          type: 'venue',
          value: ['Mysore']
        };
      } else if (output.content.toLowerCase().includes('at[pair research]')) {
        output.parsedPracticePrefix = 'At Pair Research: ';
        output.content = output.content.replace(
          /at\[pair research\]/gi,
          'Pair Research'
        );

        // update opportunity
        output.opportunity = {
          type: 'venue',
          value: ['Pair Research']
        };
      } else if (output.content.toLowerCase().match(/w\[.*?\]/g)) {
        // use regex to get all people referened by w[] tags
        const pattern = /w\[(.*?)\]/g;
        let matches;
        let people = [];
        while ((matches = pattern.exec(output.content)) !== null) {
          people.push(matches[1]);
        }
        output.parsedPracticePrefix = `With ${people.join(', ')}:`;

        // remove the w[] tags from the content, but keep the people's names
        output.content = output.content.replace(pattern, (match, p1) => p1);

        // update opportunity
        output.opportunity = {
          type: 'people',
          value: people
        };
      } else {
        output.parsedPracticePrefix = 'Help seek: '; // TODO: allow for including people
      }
      break;
    default:
      break;
  }

  // now work on representations
  if (output.content.toLowerCase().match(/rep\[.*?\]/g)) {
    // use regex to get all representations referenced by rep[] tags
    const pattern = /rep\[(.*?)\]/g;
    let matches;
    let representations = [];
    while ((matches = pattern.exec(output.content)) !== null) {
      let matchSplit = matches[1].split(':');
      representations.push({
        type: matchSplit[0].trim(),
        name: matchSplit[1].trim()
      });
    }
    // remove the rep[] tags from the content, but keep the people's names
    output.content = output.content.replace(pattern, (match, p1) => p1);

    // add representations
    for (let rep of representations) {
      output.representations.push(representationObjects[rep.name]);

      // now replace the representations with actual links
      output.content = output.content.replace(
        `${rep.type}: ${rep.name}`,
        `<${representationObjects[rep.name].link}|${rep.name}>`
      );
    }

    // TODO: special cases for no links
    // 'write: __', // drafting a section
    //   'table: __',
    //   'diagram: __'
  }

  return output;
};

const representationObjects = {
  'problem statement': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/1-l3I6hPhxh0vVGWEskGWoSZzlynukm0VcK454g3BBZE/edit?usp=sharing'
  },
  'design argument': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/1XBeg8wzUuJdyoH-3iTCCRAt6Ms-pA8Uo8fb5Ph3NQqs/edit?usp=sharing'
  },
  'interface argument': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/1W_k1U_6tFXQGNLQhZLjvPBSJvi39aWuPrxeFusfZmmE/edit#slide=id.g7a021c9e6b_0_0'
  },
  'system argument': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/1zO6aD9PF2UFd3bymJnKRze-ELU14PrYDWyB0dptt6bc/edit#slide=id.gabb324518a_1_0'
  },
  'user testing plan': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/16M8iUME45vkFdW0LEOaO3iF_8gTtMoxxn79NWdsm-jE/edit#slide=id.g1264dfdd478_0_0'
  },
  'testing takeaways': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/16PVwTLMvlMbiVl2rPc7JZqrvxMDqJGQJXc8BrSGZ7Vw/edit#slide=id.g1264dfdd61b_0_0'
  },
  'approach tree': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/1c2VRPFKJVD-kgr1SQXRSHB_HwW1inAZJrjzfNWj-b00/edit?usp=sharing'
  },
  '8-pack': {
    type: 'canvas',
    link: 'https://docs.google.com/presentation/d/1hWU6zffwzjkE5i2oUcQGUJJZSuQlNnKPO1w-MiAbZq0/edit#slide=id.g113e71d3621_0_56'
  },
  'journey map': {
    type: 'design',
    link: 'https://www.nngroup.com/articles/customer-journey-mapping/'
  },
  storyboard: {
    type: 'design',
    link: 'http://hci.stanford.edu/courses/cs147/2009/assignments/storyboard_notes.pdf'
  },
  'risk assessment': {
    type: 'planning',
    link: 'https://docs.google.com/presentation/d/1yHOjsZEyrXhs4C_cBln7sdpLDEYdDzvhP_zlQ1-3ePE/edit#slide=id.g113e71d3621_0_56'
  }
};
