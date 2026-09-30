/**
 * Label + form control + error message.
 * Renders <select> when "options" is given, <textarea> for type="textarea", otherwise <input>.
 * The error message gets the id "<id>-error" so tests can find it.
 */
export default function Input({ id, label, error, type = 'text', options, className, ...props }) {
  const errorId = `${id}-error`
  const controlProps = {
    id,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
    ...props,
  }

  let control
  if (options) {
    control = (
      <select {...controlProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    )
  } else if (type === 'textarea') {
    control = <textarea rows={3} {...controlProps} />
  } else {
    control = <input type={type} {...controlProps} />
  }

  return (
    <div className={['form-field', className].filter(Boolean).join(' ')}>
      {label && <label htmlFor={id}>{label}</label>}
      {control}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
