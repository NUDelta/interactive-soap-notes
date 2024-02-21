import { Switch } from '@headlessui/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import TextBox from './TextBox';

export default function Issue({
  issueIndex,
  title,
  diagSections,
  summarySections,
  autocompleteTriggersOptions,
  soapData,
  setSoapData
}): JSX.Element {
  const [isDiagMode, setDiagMode] = useState(true);
  const [shouldHideContent, setShouldHideContent] = useState(true);

  return (
    <div className="border p-2 mb-5">
      {/* Issue title */}
      <div className="flex flex-wrap mb-1 w-full">
        <textarea
          value={title}
          onChange={(e) =>
            setSoapData((prevData) => ({
              ...prevData,
              issues: prevData.issues.map((issue, i) => {
                if (i === issueIndex) {
                  return {
                    ...issue,
                    ['title']: e.target.value
                  };
                } else {
                  return issue;
                }
              })
            }))
          }
          placeholder="Describe the issue..."
          className="w-2/3 text-md font-bold mr-3 h-14"
        />
        {/* Show or hide note details */}
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1 h-8 rounded-full mr-3"
          onClick={() => setShouldHideContent(!shouldHideContent)}
        >
          {shouldHideContent ? 'Show Notes' : 'Hide Notes'}
        </button>
        {/* Switch between diagnosis mode and summary mode */}
        {!shouldHideContent && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1 h-8 rounded-full  mr-3"
            onClick={() => setDiagMode(!isDiagMode)}
          >
            {isDiagMode ? 'Switch to Summary Mode' : 'Switch to Diagnosis Mode'}
          </button>
        )}

        {/* Buttons to rearrange issues and delete */}
        {/* TODO: allor for rearranging */}
        {/* <ArrowUpIcon
          className={`h-6 w-6 mr-3 ${issueIndex === 0 ? 'opacity-25' : 'opacity-100'}`}
        />
        <ArrowDownIcon className="h-6 w-6 mr-3" /> */}
        {/* TODO: move icons to right side */}
        <TrashIcon
          className="h-6 w-6 mr-3 hover:text-red-600"
          onClick={(e) => {
            // confirm deletion using an alert
            if (
              window.confirm(
                `Are you sure you want to delete the issue "${title}"? It cannot be undone.`
              )
            ) {
              setSoapData((prevData) => ({
                ...prevData,
                issues: prevData.issues.filter((issue, i) => i !== issueIndex)
              }));
            }
          }}
        />

        {/* Warning messages for incomplete follow-ups */}
        <div
          className={`flex flex-wrap text-md text-orange-500 py-1 ${soapData.plan.trim() === '' || soapData.plan.trim() === '-' ? '' : 'opacity-0'}`}
        >
          <ExclamationTriangleIcon className="h-6" />
          <span>
            Issue does not have any follow-up plans written or actionable
            check-ins encoded
          </span>
        </div>
      </div>

      {/* Issues */}
      {!shouldHideContent && (
        <div className="">
          <div>
            {/* Switch between Diagnosis mode and summary mode */}
            {(isDiagMode ? diagSections : summarySections).map((section) => (
              <div className={`w-full`} key={section.name}>
                <h1 className="font-bold text-xl">{section.title}</h1>
                {section.name === 'plan' && (
                  <h2 className="text-sm color-grey">
                    Add plans for Orchestration Engine to follow-up on by
                    typing, &quot;[script]&quot;. These will be sent to the
                    students&apos; project channel.
                  </h2>
                )}

                {/* TODO: abstract out the update code */}
                <TextBox
                  value={soapData[section.name]}
                  triggers={Object.keys(
                    autocompleteTriggersOptions[section.name]
                  )}
                  options={autocompleteTriggersOptions[section.name]}
                  onFocus={(e) => {
                    // add a "- " if the text box is empty
                    if (e.target.value === '') {
                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: prevData.issues.map((issue, i) => {
                          if (i === issueIndex) {
                            return {
                              ...issue,
                              [section.name]: '- '
                            };
                          } else {
                            return issue;
                          }
                        })
                      }));
                    }
                  }}
                  onBlur={(e) => {
                    // remove the dash if the text box is empty
                    if (e.target.value.trim() === '-') {
                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: prevData.issues.map((issue, i) => {
                          if (i === issueIndex) {
                            return {
                              ...issue,
                              [section.name]: ''
                            };
                          } else {
                            return issue;
                          }
                        })
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
                        lines[lines.length - 1].includes('[script]')
                      ) {
                        return;
                      }

                      setSoapData((prevData) => ({
                        ...prevData,
                        issues: prevData.issues.map((issue, i) => {
                          if (i === issueIndex) {
                            return {
                              ...issue,
                              [section.name]: `${e.target.value}- `
                            };
                          } else {
                            return issue;
                          }
                        })
                      }));
                    }
                  }}
                  onChange={(edits) =>
                    setSoapData((prevData) => ({
                      ...prevData,
                      issues: prevData.issues.map((issue, i) => {
                        if (i === issueIndex) {
                          return {
                            ...issue,
                            [section.name]: edits
                          };
                        } else {
                          return issue;
                        }
                      })
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
