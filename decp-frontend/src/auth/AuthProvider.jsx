import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  AUTH_SESSION_EXPIRED_EVENT,
  AUTH_TOKENS_REFRESHED_EVENT,
} from "../api/axiosClient";
import {
  login as loginRequest,
  logout as logoutRequest,
  refreshToken as refreshTokenRequest,
} from "../api/authApi";
import {
  clearTokens,
  decodeTokenSafely,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
  saveTokens,
} from "../utils/tokenUtils";
import { AuthContext } from "./authContext";

const decodeUser = (token) => {
  const decoded = decodeTokenSafely(token);

  if (!decoded || isTokenExpired(token)) {
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
};

const extractTokens = (responseData) => {
  const payload = responseData?.data ?? responseData;

  return {
    accessToken: payload?.accessToken ?? payload?.access_token ?? payload?.token,
    refreshToken: payload?.refreshToken ?? payload?.refresh_token,
  };
};

let startupRefreshPromise = null;

const refreshTokensOnce = (refreshToken) => {
  if (!startupRefreshPromise) {
    startupRefreshPromise = refreshTokenRequest(refreshToken).finally(() => {
      startupRefreshPromise = null;
    });
  }

  return startupRefreshPromise;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    accessToken: null,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const clearSession = useCallback(() => {
    clearTokens();
    setAuthState({
      accessToken: null,
      user: null,
    });
  }, []);

  const applyAccessToken = useCallback((accessToken) => {
    const user = decodeUser(accessToken);

    if (!accessToken || !user) {
      clearTokens();
      setAuthState({
        accessToken: null,
        user: null,
      });
      return false;
    }

    setAuthState({
      accessToken,
      user,
    });
    return true;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      try {
        if (accessToken && !isTokenExpired(accessToken)) {
          const user = decodeUser(accessToken);

          if (user && isMounted) {
            setAuthState({ accessToken, user });
            return;
          }
        }

        if (accessToken && refreshToken && isTokenExpired(accessToken)) {
          const response = await refreshTokensOnce(refreshToken);
          const tokens = extractTokens(response.data);

          if (!tokens.accessToken || !tokens.refreshToken) {
            throw new Error("Refresh response did not include new tokens.");
          }

          saveTokens(tokens.accessToken, tokens.refreshToken);

          if (isMounted) {
            applyAccessToken(tokens.accessToken);
          }
          return;
        }

        clearTokens();
      } catch {
        clearTokens();
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [applyAccessToken]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
      navigate("/login", {
        replace: true,
        state: {
          sessionExpired: true,
          message: "Your session has expired. Please log in again.",
        },
      });
    };

    const handleTokensRefreshed = (event) => {
      const accessToken = event.detail?.accessToken ?? getAccessToken();
      applyAccessToken(accessToken);
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener(AUTH_TOKENS_REFRESHED_EVENT, handleTokensRefreshed);

    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener(AUTH_TOKENS_REFRESHED_EVENT, handleTokensRefreshed);
    };
  }, [applyAccessToken, clearSession, navigate]);

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
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user: authState.user,
      accessToken: authState.accessToken,
      isAuthenticated: Boolean(authState.accessToken && authState.user),
      loading,
      clearSession,
      login,
      logout,
    }),
    [authState.accessToken, authState.user, clearSession, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
