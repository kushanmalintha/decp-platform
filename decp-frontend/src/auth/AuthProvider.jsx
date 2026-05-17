import { useCallback, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

import { login as loginRequest, logout as logoutRequest } from "../api/authApi";
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "../utils/tokenUtils";
import { AuthContext } from "./authContext";

const decodeUser = (token) => {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwtDecode(token);

    if (decoded.exp && decoded.exp * 1000 <= Date.now()) {
      clearTokens();
      return null;
    }

    const roleClaim = decoded.role ?? decoded.roles ?? decoded.authorities;
    const role = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;
    const normalizedRole =
      typeof role === "string" && role.toUpperCase().startsWith("ROLE_")
        ? role.slice("ROLE_".length)
        : role;

    return {
      email: decoded.email ?? decoded.sub ?? "",
      role: normalizedRole ?? "",
    };
  } catch {
    clearTokens();
    return null;
  }
};

const extractTokens = (responseData) => {
  const payload = responseData?.data ?? responseData;

  return {
    accessToken: payload?.accessToken ?? payload?.access_token ?? payload?.token,
    refreshToken: payload?.refreshToken ?? payload?.refresh_token,
  };
};

const getInitialAuthState = () => {
  const storedAccessToken = getAccessToken();
  const restoredUser = decodeUser(storedAccessToken);

  return {
    user: restoredUser,
    accessToken: restoredUser ? storedAccessToken : null,
  };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(getInitialAuthState);
  const loading = false;

  const login = useCallback(async (credentials) => {
    const response = await loginRequest(credentials);
    const tokens = extractTokens(response.data);

    if (!tokens.accessToken) {
      throw new Error("Login response did not include an access token.");
    }

    saveTokens(tokens.accessToken, tokens.refreshToken);
    setAuthState({
      accessToken: tokens.accessToken,
      user: decodeUser(tokens.accessToken),
    });

    return response;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } finally {
      clearTokens();
      setAuthState({
        accessToken: null,
        user: null,
      });
    }
  }, []);

  const value = useMemo(
    () => ({
      user: authState.user,
      accessToken: authState.accessToken,
      isAuthenticated: Boolean(authState.accessToken && authState.user),
      loading,
      login,
      logout,
    }),
    [authState.accessToken, authState.user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
