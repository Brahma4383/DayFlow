/**
 * A row of buttons where exactly one is selected, e.g. Board | List | Calendar.
 * options: [{ value, label, id, icon }]. The selected button has aria-pressed="true".
 */
export default function SegmentedControl({ label, options, value, onChange, className }) {
  return (
    <div className={['segmented', className].filter(Boolean).join(' ')} role="group" aria-label={label}>
      {options.map(({ value: optionValue, label: optionLabel, id, icon: Icon }) => (
        <button
          key={optionValue}
          id={id}
          type="button"
          className="segmented-option"
          aria-pressed={optionValue === value}
          onClick={() => onChange(optionValue)}
        >
          {Icon && <Icon size={16} aria-hidden="true" />}
          <span>{optionLabel}</span>
        </button>
      ))}
    </div>
  )
}
