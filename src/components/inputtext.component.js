const React = require('react')

function inputTextComponent (props) {
  const value = props.value || ''

  let groupClass = 'form-group'

  let error
  if (props.errors && props.errors.length > 0) {
    error = props.errors[0]
    groupClass += ' error'
  }

  return (
    <div className={groupClass} id={props.name + '-wrapper'}>
      <label className='form-label-bold' htmlFor={props.name}>
        {props.label}
        {error &&
          <span className='error-message'>{error}</span>
        }
      </label>
      <input
        id={props.name}
        className='form-control'
        name={props.name}
        value={value}
        onChange={props.onChange}
        autoComplete='off' />
    </div>
  )
}

inputTextComponent.propTypes = {
  name: React.PropTypes.string.isRequired,
  label: React.PropTypes.string.isRequired,
  value: React.PropTypes.string,
  onChange: React.PropTypes.func.isRequired,
  errors: React.PropTypes.array
}

module.exports = inputTextComponent
