import Input from './Input'

// Dropdown for filtering a list. The first option ("All") has the value "".
export default function FilterDropdown({ id, label, value, options, onChange, allLabel = 'All' }) {
  return (
    <Input
      id={id}
      label={label}
      className="filter-dropdown"
      options={[{ value: '', label: allLabel }, ...options]}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
