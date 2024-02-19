import TextInput from 'react-autocomplete-input';
import 'react-autocomplete-input/dist/bundle.css';

export default function TextBox({
  value,
  triggers,
  options,
  onFocus,
  onBlur,
  onChange,
  onKeyUp
}): JSX.Element {
  return (
    <div className="">
      <TextInput
        trigger={triggers}
        options={options}
        placeholder="Type here..."
        value={value}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        onKeyUp={onKeyUp}
      />
    </div>
  );
}
