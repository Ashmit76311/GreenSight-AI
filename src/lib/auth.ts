export type User = { name: string; email: string };

type StoredUser = User & { password: string };

const isBrowser = typeof window !== "undefined";

function getUsers(): StoredUser[] {
  if (!isBrowser) return [];
  const raw = localStorage.getItem("gs_users");
  return raw ? JSON.parse(raw) : [];
}

export function getUser(): User | null {
  if (!isBrowser) return null;
  const raw = localStorage.getItem("gs_session");
  return raw ? JSON.parse(raw) : null;
}

export function login(email: string, password: string): User | null {
  const users = getUsers();
  const match = users.find((u) => u.email === email && u.password === password);
  if (!match) return null;
  const user: User = { name: match.name, email: match.email };
  localStorage.setItem("gs_session", JSON.stringify(user));
  return user;
}

export function signup(name: string, email: string, password: string): User | null {
  const users = getUsers();
  if (users.find((u) => u.email === email)) return null;
  users.push({ name, email, password });
  localStorage.setItem("gs_users", JSON.stringify(users));
  const user: User = { name, email };
  localStorage.setItem("gs_session", JSON.stringify(user));
  return user;
}

export function logout() {
  if (!isBrowser) return;
  localStorage.removeItem("gs_session");
}
