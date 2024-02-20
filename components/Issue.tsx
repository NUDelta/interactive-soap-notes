import { Switch } from '@headlessui/react';
import { useState } from 'react';
import TextBox from './TextBox';

export default function Issue({
  title,
  summary,
  diagSections,
  summarySections,
  autocompleteTriggersOptions,
  soapData, // TODO: have pieces passsed individually
  setSoapData, // TODO: have a save function that takes which issue is being edited and which section was updated, and send that back to the main view
  detectedIssues,
  followUpPlans,
  onChange
}): JSX.Element {
  const [isDiagMode, setDiagMode] = useState(true);
  const [shouldHideContent, setShouldHideContent] = useState(false);
  const [issueTitle, setIssueTitle] = useState(title); // TODO: the state management for changes should be done in the parent component

  return (
    <div className="border p-2 mb-5">
      {/* Issue title */}
      <div className="mb-3 w-full">
        <label className="w-full m:w-200 font-bold text-xl mr-3 h-8">
          {/* Issue:{' '} */}
          <input
            type="text"
            value={issueTitle}
            onChange={(e) => setIssueTitle(e.target.value)}
            className="w-full text-lg font-normal border px-1"
          />
        </label>
      </div>

      <div>
        {/* Show or hide note details */}
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold px-4 h-8 rounded-full mr-3"
          onClick={() => setShouldHideContent(!shouldHideContent)}
        >
          {shouldHideContent ? 'Show Issue Notes' : 'Hide Issue Notes'}
        </button>

        {/* Switch between diagnosis mode and summary mode */}
        {!shouldHideContent && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold py-1 px-4 h-8 rounded-full"
            onClick={() => setDiagMode(!isDiagMode)}
          >
            {isDiagMode ? 'Switch to Summary Mode' : 'Switch to Diagnosis Mode'}
          </button>
        )}
      </div>

      {/* Diagnosis mode */}
      {isDiagMode && !shouldHideContent && (
        <div>
          {diagSections.map((section) => (
            <div className={`w-full`} key={section.name}>
              <h1 className="font-bold text-xl">{section.title}</h1>
              {section.name === 'plan' && (
                <h2 className="text-sm color-grey">
                  Add plans for Orchestration Engine to follow-up on by typing,
                  &quot;[script]&quot;. These will be sent to the students&apos;
                  project channel.
                </h2>
              )}

              {/* TODO: abstract out the update code */}
              {/* TODO: this won't update until the state updating logic is fixed */}
              <TextBox
                value={soapData[section.name]}
                triggers={Object.keys(
                  autocompleteTriggersOptions[section.name]
                )}
                options={autocompleteTriggersOptions[section.name]}
                onFocus={(e) => {
                  // add a "- " if the text box is empty
                  if (e.target.value === '') {
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = '- ';
                      return newSoapData;
                    });
                  }
                }}
                onBlur={(e) => {
                  // remove the dash if the text box is empty
                  if (e.target.value.trim() === '-') {
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = '';
                      return newSoapData;
                    });
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

                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = `${e.target.value}- `;
                      return newSoapData;
                    });
                  }
                }}
                onChange={(edits) => {
                  // update the state with the new data
                  setSoapData((prevSoapData) => {
                    let newSoapData = { ...prevSoapData };
                    newSoapData[section.name] = edits;
                    return newSoapData;
                  });
                }}
              />
            </div>
          ))}
        </div>
      )}
      {/* Summary mode */}
      {!isDiagMode && !shouldHideContent && (
        <div>
          {summarySections.map((section) => (
            <div className={`w-full`} key={section.name}>
              <h1 className="font-bold text-xl">{section.title}</h1>
              {section.name === 'plan' && (
                <h2 className="text-sm color-grey">
                  Add plans for Orchestration Engine to follow-up on by typing,
                  &quot;[script]&quot;. These will be sent to the students&apos;
                  project channel.
                </h2>
              )}

              <div className="">
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
                      setSoapData((prevSoapData) => {
                        let newSoapData = { ...prevSoapData };
                        newSoapData[section.name] = '- ';
                        return newSoapData;
                      });
                    }
                  }}
                  onBlur={(e) => {
                    // remove the dash if the text box is empty
                    if (e.target.value.trim() === '-') {
                      setSoapData((prevSoapData) => {
                        let newSoapData = { ...prevSoapData };
                        newSoapData[section.name] = '';
                        return newSoapData;
                      });
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

                      setSoapData((prevSoapData) => {
                        let newSoapData = { ...prevSoapData };
                        newSoapData[section.name] = `${e.target.value}- `;
                        return newSoapData;
                      });
                    }
                  }}
                  onChange={(edits) => {
                    // update the state with the new data
                    setSoapData((prevSoapData) => {
                      let newSoapData = { ...prevSoapData };
                      newSoapData[section.name] = edits;
                      return newSoapData;
                    });
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
