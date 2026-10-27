/**
 * Helper to generate initial password based on user's email:
 * 3 first letters of the email username + '123'
 * Example: 'carlos@fazenda.com' -> 'car123'
 */
export function generateUserPassword(email: string): string {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return "";
  const prefix = cleanEmail.split("@")[0] || cleanEmail;
  const letters = prefix.replace(/[^a-z0-9]/g, "").slice(0, 3);
  const base = letters.padEnd(3, "a");
  return `${base}123`;
}
