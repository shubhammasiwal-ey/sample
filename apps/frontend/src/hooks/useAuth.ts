'use client';

import { useEffect, useCallback, useRef } from 'react';
import apiClient from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from '@/navigation';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const isFetchingRef = useRef(false); // Prevent duplicate fetches in same component
  const autoLogoutRef = useRef(false);
  const {
    user,
    roles,
    resources,
    loading,
    error,
    hasFetched,
    setUser,
    setRoles,
    setResources,
    setLoading,
    setError,
    setHasFetched,
  } = useAuthStore();

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/profile', { timeout: 8000 });
      const userData = response.data;

      setUser({
        id: userData.user.id,
        email: userData.user.email,
        userType: userData.user.userType,
        roleId: userData.user.roleId,
        roleName: userData.user.roleName,
        isEmailVerified: userData.user.isEmailVerified,
        lastLoginAt: userData.user.lastLoginAt,
        firstName: userData.profile?.firstName || userData.profile?.fullName || '',
        lastName: userData.profile?.lastName || '',
        deptId: userData.profile?.deptId,
      });

      if (userData.resources) {
        setResources(userData.resources);
      }

      setError(null);
    } catch (err: any) {
      setUser(null);
      setResources([]);
      const isUnauthorized = err.response?.status === 401;
      setError(isUnauthorized ? 'Not authenticated' : 'Access denied');

      if (isUnauthorized) {
        const isAuthRoute =
          pathname?.includes('/') ||
          pathname?.includes('/login') ||
          pathname?.includes('/register') ||
          pathname?.includes('/forgot-password') ||
          pathname?.includes('/reset-password') ||
          pathname?.includes('/resend-activation') ||
          pathname?.includes('/verify-email');

        if (!isAuthRoute) {
          router.replace('/login');
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [setUser, setResources, setError, setLoading, pathname, router]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/roles');
      setRoles(response.data.data || []);
    } catch (err) {
      setRoles([]);
    }
  }, [setRoles]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Reset the fetch tracker so it can fetch again after re-login
      isFetchingRef.current = false;
      setHasFetched(false);
      setUser(null);
      setRoles([]);
      setResources([]);
      setError(null);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = `/${locale}/login`;
        return;
      }
      router.replace('/login');
    }
  }, [setUser, setRoles, setResources, setError, setLoading, setHasFetched, router, locale]);

  useEffect(() => {
    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }

    // Only fetch if not already fetched globally and user is not loaded
    if (!hasFetched && !user) {
      isFetchingRef.current = true;
      setHasFetched(true);
      fetchUser();
      fetchRoles();
    }
  }, []); // Empty dependency array - only run on mount

  const isAuthRoute =
    pathname?.includes('/login') ||
    pathname?.includes('/register') ||
    pathname?.includes('/forgot-password') ||
    pathname?.includes('/reset-password') ||
    pathname?.includes('/resend-activation') ||
    pathname?.includes('/verify-email');

  useEffect(() => {
    if (autoLogoutRef.current) return;
  }, [hasFetched, loading, user, logout, isAuthRoute]);

  return {
    user,
    roles,
    resources,
    loading,
    error,
    setUser,
    setRoles,
    setResources,
    setLoading,
    setError,
    logout,
    refresh: fetchUser,
    fetchRoles,
  };
}
