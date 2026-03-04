import { authService } from "@/services/auth";
import { useAuthStore } from "@/store/auth-store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (data) => {
      await setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useSignUp() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authService.signUp,
    onSuccess: async (data) => {
      await setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: authService.resetPassword,
  });
}

export function useResetPasswordConfirm() {
  return useMutation({
    mutationFn: authService.resetPasswordConfirm,
  });
}

export function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authService.googleLogin,
    onSuccess: async (data) => {
      await setAuth({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: authService.changePassword,
  });
}

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const user = await authService.getProfile();
      setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
}

export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.updateUsername,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUpdateFullName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.updateFullName,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRequestDeletion() {
  return useMutation({
    mutationFn: authService.requestDeletion,
  });
}

export function useLogout() {
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  return async () => {
    await logout();
    queryClient.clear();
  };
}

const FALLBACK_URL = "https://binahstudio.com";

export function useResources() {
  return useQuery({
    queryKey: ["resources"],
    queryFn: authService.getResources,
    staleTime: 1000 * 60 * 60,
    select: (data) => ({
      policyUrl: data.policyUrl || FALLBACK_URL,
      privacyUrl: data.privacyUrl || FALLBACK_URL,
    }),
  });
}
