'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AuthUser } from '@/lib/types';

export function useCurrentUser() {
  return useQuery<AuthUser | null>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const { data } = await api.get<AuthUser>('/auth/me');
        return data;
      } catch {
        return null;
      }
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const { data } = await api.post<AuthUser>('/auth/login', input);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      password: string;
      name: string;
      role?: 'BUYER' | 'SHOP_OWNER';
    }) => {
      const { data } = await api.post<AuthUser>('/auth/signup', input);
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'me'], user);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      await api.post('/auth/forgot-password', input);
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; password: string }) => {
      await api.post('/auth/reset-password', input);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['auth', 'me'], null);
    },
  });
}
