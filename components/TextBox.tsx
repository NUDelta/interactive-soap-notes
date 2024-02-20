import TextInput from 'react-autocomplete-input';
import 'react-autocomplete-input/dist/bundle.css';
import { useState } from 'react';

export default function TextBox({
  value,
  triggers,
  options,
  onFocus,
  onBlur,
  onKeyUp,
  onChange
}): JSX.Element {
  return (
    <TextInput
      trigger={triggers}
      options={options}
      placeholder="Type here..."
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyUp={onKeyUp}
      onChange={onChange}
      className="h-20"
    />
  );
}
