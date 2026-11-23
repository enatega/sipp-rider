// Client-side mirrors of the server's credential rules, so users see problems
// before a round trip. The server remains the source of truth.

export const RESET_CODE_LENGTH = 4;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim());

export type PasswordRule = 'length' | 'uppercase' | 'lowercase' | 'number';

export const PASSWORD_RULES: Record<PasswordRule, (password: string) => boolean> = {
  length: (password) => password.length >= 8,
  uppercase: (password) => /[A-Z]/.test(password),
  lowercase: (password) => /[a-z]/.test(password),
  number: (password) => /\d/.test(password),
};

export const meetsPasswordRules = (password: string) =>
  (Object.keys(PASSWORD_RULES) as PasswordRule[]).every((rule) => PASSWORD_RULES[rule](password));
