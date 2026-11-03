/**
 * Authentication Service
 * Handles user authentication, sessions, and access control
 */

import { WaitlistEntry } from '@/types';

export const authService = {
  /**
   * Handle Google Sign-In (served by the Neon-backed auth routes)
   */
  async signInWithGoogle(next?: string): Promise<void> {
    if (typeof window === 'undefined') return;
    const target = next ?? `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/api/auth/google?next=${encodeURIComponent(target)}`);
  },

  /**
   * Verify admin password
   */
  verifyAdminPassword(password: string): boolean {
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'change-me-in-env';
    return password === ADMIN_PASSWORD;
  },

  /**
   * Set authentication in session storage
   */
  setAdminAuth(email: string): void {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sango_admin_auth', 'true');
      sessionStorage.setItem('sango_admin_email', email);
    }
  },

  /**
   * Check if user is authenticated as admin
   */
  isAdminAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('sango_admin_auth') === 'true';
  },

  /**
   * Get admin email from session
   */
  getAdminEmail(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('sango_admin_email');
  },

  /**
   * Logout admin
   */
  logoutAdmin(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sango_admin_auth');
      sessionStorage.removeItem('sango_admin_email');
    }
  },

  /**
   * Add email to waitlist
   */
  async addToWaitlist(email: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;

      const waitlistData: WaitlistEntry[] = JSON.parse(
        localStorage.getItem('sango_waitlist') || '[]'
      );

      // Check if email already exists
      if (waitlistData.some((entry) => entry.email === email)) {
        return true;
      }

      // Add new entry
      waitlistData.push({
        email,
        joinedAt: new Date().toISOString(),
      });

      localStorage.setItem('sango_waitlist', JSON.stringify(waitlistData));
      return true;
    } catch (error) {
      console.error('Failed to add to waitlist:', error);
      return false;
    }
  },

  /**
   * Get all waitlist entries
   */
  getWaitlist(): WaitlistEntry[] {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('sango_waitlist') || '[]');
  },

  /**
   * Remove email from waitlist
   */
  removeFromWaitlist(email: string): void {
    if (typeof window === 'undefined') return;

    const waitlistData: WaitlistEntry[] = JSON.parse(
      localStorage.getItem('sango_waitlist') || '[]'
    );

    const filtered = waitlistData.filter((entry) => entry.email !== email);
    localStorage.setItem('sango_waitlist', JSON.stringify(filtered));
  },
};
