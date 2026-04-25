export interface AuthUser {
  name: string;
  email: string;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem('auth-user');
    return val ? (JSON.parse(val) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser) {
  localStorage.setItem('auth-user', JSON.stringify(user));
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `auth-session=${encodeURIComponent(JSON.stringify(user))}; path=/; expires=${expires}`;
}

export function clearAuthUser() {
  localStorage.removeItem('auth-user');
  document.cookie = 'auth-session=; path=/; max-age=0';
}
