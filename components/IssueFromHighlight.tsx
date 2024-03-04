import React, { useState, useEffect } from 'react';
import CreatableSelect from 'react-select/creatable';

export default function IssueFromHighlight({
  selectOptions,
  onClick
}): JSX.Element {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isMounted, setIsMounted] = useState(false);

  // Must be deleted once
  // https://github.com/JedWatson/react-select/issues/5459 is fixed.
  // from: https://github.com/JedWatson/react-select/issues/5459#issuecomment-1458451734
  useEffect(() => setIsMounted(true), []);

  return isMounted ? (
    <div className={`w-30 bg-white `}>
      <h3 className="text-md font-bold mt-2">
        Select an existing issue to add notes to, or type the name of a new
        issue:{' '}
      </h3>
      <div className="flex">
        <div className="flex flex-col w-3/4">
          <CreatableSelect
            value={selectedOption}
            isClearable
            onChange={(selectedOption) => {
              setSelectedOption(selectedOption);
            }}
            options={selectOptions}
          />
        </div>
        <div className="flex flex-auto ml-4">
          {selectedOption && (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white text-sm font-bold px-4 h-8 rounded-full"
              onClick={(e) => {
                onClick(e, selectedOption);
                setSelectedOption(null);
              }}
            >
              {selectOptions.some(
                (option) => option.label === selectedOption.label
              )
                ? 'Add to issue'
                : 'Create issue'}
            </button>
          )}
        </div>
      </div>
    </div>
  ) : null;
}
