import { useState } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import type { User } from "../types/user";
import { AuthContext } from "./AuthContext.ts"; // Import it now

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    const response = await api.post("/login", { email, password });
    localStorage.setItem("token", response.data.access_token);

    const userResponse = await api.get("/users/me");
    setUser(userResponse.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};