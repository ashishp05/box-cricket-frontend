import { type ClipboardEvent, type KeyboardEvent, useRef } from 'react';

// Six single-digit boxes with paste support and SMS autofill (autocomplete="one-time-code").
export const OtpInput = ({
  value,
  onChange,
  length = 6,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join('').slice(0, length));
  };

  const handleInput = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (clean.length > 1) {
      // Autofill or fast typing can drop several digits into one box.
      onChange((digits.slice(0, index).join('') + clean).slice(0, length));
      refs.current[Math.min(index + clean.length, length - 1)]?.focus();
      return;
    }
    setAt(index, clean);
    if (clean && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKey = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      setAt(index - 1, '');
      refs.current[index - 1]?.focus();
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    else if (event.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    event.preventDefault();
    onChange(pasted);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="otp" role="group" aria-label="One time password, 6 digits">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={el => {
            refs.current[index] = el;
          }}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={index === 0 ? length : 1}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          onChange={event => handleInput(index, event.target.value)}
          onKeyDown={event => handleKey(index, event)}
          onPaste={handlePaste}
          onFocus={event => event.target.select()}
        />
      ))}
    </div>
  );
};
