import { Switch } from '@headlessui/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import TextBox from './TextBox';
import { longDate } from '../lib/helperFns';

export default function IssuePane({
  issueId,
  soapData,
  setSoapData,
  summarySections,
  autocompleteTriggersOptions
}): JSX.Element {
  // get the issue from soapData with the given issueId
  const issueIndex = soapData.issues.findIndex((issue) => issue.id === issueId);
  const currIssue = soapData.issues[issueIndex];
  const currInstance = currIssue.currentInstance;
  const priorInstances = currIssue.priorInstances;

  return (
    <div className="border p-2 mb-5">
      {/* Issue title */}
      <div className="flex flex-wrap mb-1 w-full">
        <h2 className="text-lg font-bold">Practice:</h2>
        <textarea
          value={currIssue.title}
          onChange={(e) => {
            let updatedIssues = soapData.issues;
            updatedIssues[issueIndex].title = e.target.value;
            updatedIssues[issueIndex].lastUpdated = longDate(new Date());

            setSoapData((prevData) => ({
              ...prevData,
              issues: updatedIssues
            }));
          }}
          placeholder="Describe the issue..."
          className="w-full text-base mb-2 p-1 h-16"
        />

        <h2 className="text-lg font-bold">Description of practice:</h2>
        <textarea
          value={currIssue.description}
          onChange={(e) => {
            let updatedIssues = soapData.issues;
            updatedIssues[issueIndex].description = e.target.value;
            updatedIssues[issueIndex].lastUpdated = longDate(new Date());

            setSoapData((prevData) => ({
              ...prevData,
              issues: updatedIssues
            }));
          }}
          placeholder="Describe the issue..."
          className="w-full text-base p-1 h-20"
        />

        {/* Current Issue Instance */}
        <div className="w-full mt-4">
          <div className="flex border-b border-black mb-2">
            <h1 className="inline-flex font-bold text-xl mr-2">
              Current Issue for Practice
            </h1>

            {/* Warning messages for incomplete follow-ups on current instance */}
            <div
              className={`inline-flex items-center text-md text-orange-500 ${currInstance !== null && currInstance.plan.trim().length === 0 ? '' : 'opacity-0'}`}
            >
              <ExclamationTriangleIcon className="h-4" />
              <span className="mx-1 font-medium">Missing practice plan</span>
            </div>
          </div>

          {/* show if no current instance is there already */}
          {currInstance === null && (
            <div className="mt-2">
              <h2 className="text-sm color-grey">
                Add a new issue for the practice by clicking the button below.
              </h2>
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold px-2 py-1 h-8 rounded-full mt-2"
                onClick={() => {
                  let updatedIssues = soapData.issues;
                  updatedIssues[issueIndex].currentInstance = {
                    date: new Date(),
                    context: '',
                    summary: '',
                    plan: '',
                    practices: []
                  };
                  updatedIssues[issueIndex].lastUpdated = longDate(new Date());

                  setSoapData((prevData) => ({
                    ...prevData,
                    issues: updatedIssues
                  }));
                }}
              >
                Add Issue
              </button>
            </div>
          )}

          {/* show if there is a current instance */}
          {currInstance !== null &&
            summarySections.map((section) => (
              <div className={`w-full`} key={section.name}>
                <h1 className="font-bold text-lg">{section.title}</h1>
                {section.name === 'plan' && (
                  <h2 className="text-sm color-grey">
                    Add practices for Orchestration Engine to follow-up on by
                    typing, &quot;[practice]&quot;. These will be sent to the
                    students&apos; project channel.
                  </h2>
                )}

                {/* TODO: abstract out the update code */}
                <TextBox
                  value={currInstance[section.name]}
                  triggers={Object.keys(
                    autocompleteTriggersOptions[section.name]
                  )}
                  options={autocompleteTriggersOptions[section.name]}
                  onFocus={(e) => {
                    // add a "- " if the text box is empty
                    if (e.target.value === '') {
                      let updatedIssues = soapData.issues;
                      updatedIssues[issueIndex].currentInstance[section.name] =
                        '- ';
                      updatedIssues[issueIndex].lastUpdated = longDate(
                        new Date()
                      );

                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    // remove the dash if the text box is empty
                    if (e.target.value.trim() === '-') {
                      let updatedIssues = soapData.issues;
                      updatedIssues[issueIndex].currentInstance[section.name] =
                        '';
                      updatedIssues[issueIndex].lastUpdated = longDate(
                        new Date()
                      );

                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }
                  }}
                  onKeyUp={(e) => {
                    // add a new line to the text box with a dash when the user presses enter
                    if (e.key === 'Enter') {
                      // check if it's not a script line
                      let lines = e.target.value.split('\n');
                      if (
                        lines.length >= 1 &&
                        lines[lines.length - 1].includes('[practice]')
                      ) {
                        return;
                      }

                      let updatedIssues = soapData.issues;
                      updatedIssues[issueIndex].currentInstance[section.name] =
                        e.target.value + '- ';
                      updatedIssues[issueIndex].lastUpdated = longDate(
                        new Date()
                      );

                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: updatedIssues
                      }));
                    }
                  }}
                  onChange={(edits) => {
                    let updatedIssues = soapData.issues;
                    updatedIssues[issueIndex].currentInstance[section.name] =
                      edits;
                    updatedIssues[issueIndex].lastUpdated = longDate(
                      new Date()
                    );

                    setSoapData((prevData) => ({
                      ...prevData,
                      issues: updatedIssues
                    }));
                  }}
                  onMouseUp={(e) => {
                    return;
                  }}
                  className="h-24 p-1"
                />
              </div>
            ))}

          {/* Button to remove current instance */}
          {currInstance !== null && (
            <button
              className="bg-red-500 hover:bg-red-700 text-white text-xs font-bold px-4 py-1 h-8 rounded-full mt-2 mb-2"
              onClick={() => {
                // confirm with user before removing
                if (
                  !confirm(
                    'Are you sure you want to remove the current issue instance?'
                  )
                ) {
                  return;
                }

                // remove the current instance
                let updatedIssues = soapData.issues;
                updatedIssues[issueIndex].currentInstance = null;
                updatedIssues[issueIndex].lastUpdated = longDate(new Date());

                setSoapData((prevData) => ({
                  ...prevData,
                  issues: updatedIssues
                }));
              }}
            >
              Remove current issue
            </button>
          )}
        </div>

        {/* Prior Issue Instances */}
        <div className="w-full mt-4">
          <h1 className="font-bold text-xl border-b border-black mb-2">
            Prior Issues
          </h1>
          {priorInstances.length === 0 && (
            <h2 className="text-sm color-grey">
              There are no prior issues for this stripIdFromPractice.
            </h2>
          )}
          {priorInstances.map((instance, i) => (
            <div
              className="w-full border border-gray-300 rounded-lg mb-3 p-1"
              key={i}
            >
              <h2 className="text-sm font-bold">{instance.date}</h2>
              <h3 className="text-sm font-bold mt-2">Summary:</h3>
              <p className="text-sm">{instance.summary}</p>
              <h3 className="text-sm font-bold mt-2">Practices:</h3>
              <p className="text-sm">
                {instance.plan && instance.plan.length ? (
                  <>{instance.plan}</>
                ) : (
                  <span className="italic">
                    No follow-up practices for this issue instance.
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
