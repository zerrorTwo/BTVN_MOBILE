export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return "Email is required";
  }
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters";
  }
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name || name.trim().length === 0) {
    return "Name is required";
  }
  return null;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
): string | null => {
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return null;
};
