import { useState, useCallback } from "react";

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
}

interface FieldState {
  value: string;
  error: string;
  touched: boolean;
}

interface FormState {
  [key: string]: FieldState;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+\d\s\-\(\)]{7,20}$/;

export function useFormValidation(fields: Record<string, ValidationRules>) {
  const initial: FormState = {};
  for (const key of Object.keys(fields)) {
    initial[key] = { value: "", error: "", touched: false };
  }

  const [form, setForm] = useState<FormState>(initial);
  const [submitted, setSubmitted] = useState(false);

  const validate = useCallback(
    (name: string, value: string): string => {
      const rules = fields[name];
      if (!rules) return "";
      if (rules.required && !value.trim()) return "This field is required";
      if (rules.email && value && !EMAIL_REGEX.test(value)) return "Invalid email address";
      if (rules.phone && value && !PHONE_REGEX.test(value)) return "Invalid phone number";
      if (rules.minLength && value.length < rules.minLength)
        return `Minimum ${rules.minLength} characters required`;
      if (rules.maxLength && value.length > rules.maxLength)
        return `Maximum ${rules.maxLength} characters allowed`;
      if (rules.pattern && value && !rules.pattern.test(value)) return "Invalid format";
      return "";
    },
    [fields]
  );

  const setValue = (name: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: { value, error: validate(name, value), touched: true },
    }));
  };

  const setTouched = (name: string) => {
    setForm((prev) => ({
      ...prev,
      [name]: { ...prev[name], touched: true, error: validate(name, prev[name].value) },
    }));
  };

  const isValid = Object.keys(fields).every(
    (key) => form[key]?.value.trim() && !form[key]?.error
  );

  const handleSubmit = (cb: () => void) => {
    return (e: React.FormEvent) => {
      e.preventDefault();
      let allValid = true;
      const next: FormState = {};
      for (const key of Object.keys(fields)) {
        const err = validate(key, form[key]?.value || "");
        next[key] = { value: form[key]?.value || "", error: err, touched: true };
        if (err) allValid = false;
      }
      setForm(next);
      if (allValid) {
        setSubmitted(true);
        cb();
      }
    };
  };

  const reset = () => {
    const fresh: FormState = {};
    for (const key of Object.keys(fields)) {
      fresh[key] = { value: "", error: "", touched: false };
    }
    setForm(fresh);
    setSubmitted(false);
  };

  return { form, setValue, setTouched, isValid, submitted, handleSubmit, reset };
}
