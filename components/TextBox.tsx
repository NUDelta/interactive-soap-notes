import TextInput from 'react-autocomplete-input';
import 'react-autocomplete-input/dist/bundle.css';

export default function TextBox({
  value = '',
  triggers = [],
  options = {},
  spacer = '',
  onFocus = () => {},
  onBlur = () => {},
  onKeyUp = () => {},
  onKeyDown = () => {},
  onChange = (value) => {},
  onMouseUp = () => {},
  className = 'h-6 px-1'
}): JSX.Element {
  return (
    <TextInput
      trigger={triggers}
      options={options}
      spacer={spacer}
      placeholder="Type here..."
      value={value}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyUp={onKeyUp}
      onKeyDown={onKeyDown}
      onChange={onChange}
      onMouseUp={onMouseUp}
      className={className}
      maxOptions={0}
      regex="^[a-zA-Z0-9_:\- ]+$"
    />
  );
}
