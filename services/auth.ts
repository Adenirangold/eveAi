import api from "@/lib/axios";
import type { User } from "@/store/auth-store";

interface LoginPayload {
  email: string;
  password: string;
}

interface SignUpPayload {
  email: string;
  password: string;
  fullName: string;
}

interface ForgotPasswordPayload {
  email: string;
}

interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

interface MessageData {
  message: string;
}

interface ResourcesData {
  policyUrl: string | null;
  privacyUrl: string | null;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthData> => {
    const { data } = await api.post<ApiResponse<AuthData>>(
      "/auth/signin",
      payload,
    );
    return data.data;
  },

  signUp: async (payload: SignUpPayload): Promise<AuthData> => {
    const { data } = await api.post<ApiResponse<AuthData>>(
      "/auth/signup",
      payload,
    );
    return data.data;
  },

  resetPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<MessageData> => {
    const { data } = await api.post<ApiResponse<MessageData>>(
      "/auth/reset-password",
      payload,
    );
    return data.data;
  },

  resetPasswordConfirm: async (
    payload: ResetPasswordPayload,
  ): Promise<MessageData> => {
    const { data } = await api.post<ApiResponse<MessageData>>(
      "/auth/reset-password/confirm",
      payload,
    );
    return data.data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get<ApiResponse<User>>("/me");
    return data.data;
  },

  updateUsername: async (username: string): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>("/me/username", {
      username,
    });
    return data.data;
  },

  updateFullName: async (fullName: string): Promise<User> => {
    const { data } = await api.patch<ApiResponse<User>>("/me/fullname", {
      fullName,
    });
    return data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<MessageData> => {
    const { data } = await api.patch<ApiResponse<MessageData>>(
      "/me/password",
      payload,
    );
    return data.data;
  },

  googleLogin: async (idToken: string): Promise<AuthData> => {
    const { data } = await api.post<ApiResponse<AuthData>>("/auth/google", {
      idToken,
    });
    return data.data;
  },

  resendVerification: async (email: string): Promise<MessageData> => {
    const { data } = await api.post<ApiResponse<MessageData>>(
      "/auth/resend-verification",
      { email },
    );
    return data.data;
  },

  requestDeletion: async (): Promise<MessageData> => {
    const { data } = await api.post<ApiResponse<MessageData>>(
      "/auth/request-deletion",
    );
    return data.data;
  },

  getResources: async (): Promise<ResourcesData> => {
    const { data } = await api.get<ApiResponse<ResourcesData>>("/resources");
    return data.data;
  },
};
