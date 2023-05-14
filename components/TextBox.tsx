import TextInput from 'react-autocomplete-input';
import 'react-autocomplete-input/dist/bundle.css';

export default function TextBox({
  value,
  triggers,
  options,
  onChange,
}): JSX.Element {
  return (
    <div className="">
      <TextInput
        trigger={triggers}
        options={options}
        placeholder="Type here..."
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
