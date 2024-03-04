import TextInput from 'react-autocomplete-input';
import 'react-autocomplete-input/dist/bundle.css';

export default function TextBox({
  value,
  triggers,
  options,
  onFocus,
  onBlur,
  onKeyUp,
  onChange,
  onMouseUp,
  className = 'h-20 px-1'
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
      onMouseUp={onMouseUp}
      className={className}
    />
  );
}
