import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import type { User } from "../types/user";
import { AuthContext } from "./AuthContext.ts";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/me");
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem("token");
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    // 1. Create Form Data instead of a JSON object
    const params = new URLSearchParams();
    params.append("username", email);
    params.append("password", password);

    // 2. Send with the correct header
    const response = await api.post("/login", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    localStorage.setItem("token", response.data.access_token);

    // 3. Make sure this endpoint matches your main.py!
    // In your main.py it was just "/me", not "/users/me"
    const userResponse = await api.get("/me");
    setUser(userResponse.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    // 2. Pass loading through if you want, but at least wait for it
    <AuthContext.Provider value={{ user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
