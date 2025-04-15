import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  isAdmin: boolean;
  credits?: number;
};

export function useAuth() {
  const [location, setLocation] = useLocation();
  
  // Current user query
  const { 
    data: userData,
    isLoading,
    isError,
  } = useQuery<{ user: User } | null>({
    queryKey: ['/api/me'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    },
  });

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/admin/login', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setLocation('/');
    },
  });

  // Reseller login mutation
  const resellerLoginMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      const res = await apiRequest('POST', '/api/reseller/login', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setLocation('/');
    },
  });

  // Reseller registration mutation
  const resellerRegisterMutation = useMutation({
    mutationFn: async (data: { 
      username: string; 
      email: string;
      password: string;
      referralToken: string;
    }) => {
      const res = await apiRequest('POST', '/api/reseller/register', data);
      return res.json();
    },
    onSuccess: () => {
      setLocation('/reseller/login');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/logout', {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      setLocation('/');
    },
  });

  return {
    user: userData?.user || null,
    isLoading,
    isError,
    adminLogin: (data: { username: string; password: string }) => adminLoginMutation.mutate(data),
    resellerLogin: (data: { username: string; password: string }) => resellerLoginMutation.mutate(data),
    resellerRegister: (data: { 
      username: string; 
      email: string; 
      password: string; 
      referralToken: string 
    }) => resellerRegisterMutation.mutate(data),
    logout: () => logoutMutation.mutate(),
    adminLoginError: adminLoginMutation.error,
    resellerLoginError: resellerLoginMutation.error,
    resellerRegisterError: resellerRegisterMutation.error,
    isAdminLoginLoading: adminLoginMutation.isPending,
    isResellerLoginLoading: resellerLoginMutation.isPending,
    isResellerRegisterLoading: resellerRegisterMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
  };
}
