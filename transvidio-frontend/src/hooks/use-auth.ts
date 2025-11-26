import { useState, useEffect } from "react";

interface User {
  email: string;
  name: string;
  picture: string;
  email_verified?: boolean;
}

interface UseAuthReturn {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export default function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const clearAuth = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setToken(null);
  };

  const logout = async () => {
    try {
      if (!token) {
        clearAuth();
        return;
      }

      const res = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          clearAuth();
        }
      }
    } catch (err) {
      console.error("Logout error:", err);
      // Clear auth bahkan jika request gagal
      clearAuth();
    }
  };

  const getCurrentUser = async (authToken: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      // Token invalid atau expired
      if (res.status === 401 || res.status === 404) {
        clearAuth();
        setError("Session expired. Please login again.");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      if (data.success && data.user) {
        setUser(data.user);
        setError(null);
      } else {
        clearAuth();
        setError("Invalid user data received");
      }
    } catch (err) {
      console.error("Fetch user error:", err);
      clearAuth();
      setError(err instanceof Error ? err.message : "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token");

    if (tokenFromUrl) {
      localStorage.setItem("access_token", tokenFromUrl);
      setToken(tokenFromUrl);
      
      // Clean URL tanpa reload
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Fetch user when token changes
  useEffect(() => {
    if (token) {
      getCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  return { user, token, loading, error, loginWithGoogle, logout };
}