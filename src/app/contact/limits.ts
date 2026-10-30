// Longest allowed values, used by the form (maxLength) and checked again on the server
export const MAX_LENGTH = {
  name: 100,
  email: 254, // The longest a valid email address can be
  message: 5000,
};

// Name of the hidden honeypot field. People never see it, so only bots fill it in.
export const HONEYPOT = "website";
