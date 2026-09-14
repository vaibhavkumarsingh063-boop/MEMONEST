import { UserAccount } from '../types';

const TOKEN_KEY = 'memorymate_auth_token';
const USER_KEY = 'memorymate_auth_user';

export interface AuthResponse {
  user: UserAccount;
  token: string;
  message?: string;
}

export const authApi = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setSession(token: string, user: UserAccount): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save session to localStorage:', e);
    }
  },

  getCachedUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  },

  async signup(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create account.');
    }

    this.setSession(json.token, json.user);
    return json;
  },

  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Invalid email or password.');
    }

    this.setSession(json.token, json.user);
    return json;
  },

  async getCurrentUser(): Promise<UserAccount | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        this.clearSession();
        return null;
      }

      const json = await res.json();
      if (json.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(json.user));
        return json.user;
      }
      return null;
    } catch {
      return this.getCachedUser();
    }
  },

  async updateProfile(profileData: Partial<UserAccount>): Promise<UserAccount> {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Failed to update profile.');
    }

    localStorage.setItem(USER_KEY, JSON.stringify(json.user));
    return json.user;
  },

  async forgotPassword(email: string): Promise<{ message: string; resetCode?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || 'Could not process password reset request.');
    }
    return json;
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        console.warn('Logout request error:', e);
      }
    }
    this.clearSession();
  },
};
