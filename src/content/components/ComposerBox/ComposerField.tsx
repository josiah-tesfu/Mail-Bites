import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

interface ComposerFieldProps {
  name: 'to' | 'subject' | 'body';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isTextarea?: boolean;
  isRequired?: boolean;
  errorMessage?: string;
}

const ComposerField: React.FC<ComposerFieldProps> = memo(({
  name,
  label,
  value,
  onChange,
  placeholder,
  isTextarea = false,
  isRequired = false,
  errorMessage
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasValue = value.length > 0;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Auto-resize textarea on value change
  useEffect(() => {
    if (isTextarea && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, isTextarea]);

  if (isTextarea) {
    return (
      <div className="mail-bites-composer-section">
        <textarea
          ref={textareaRef}
          className="mail-bites-composer-textarea"
          aria-label={label}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="mail-bites-composer-section">
      <div className={`mail-bites-composer-field-wrapper${hasValue ? ' has-value' : ''}`}>
        <label
          className="mail-bites-composer-label"
          htmlFor={`composer-${name}`}
        >
          {label}
        </label>
        <input
          type="text"
          id={`composer-${name}`}
          className="mail-bites-composer-input"
          aria-label={label}
          name={name}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
});

ComposerField.displayName = 'ComposerField';

export { ComposerField };
export default ComposerField;
