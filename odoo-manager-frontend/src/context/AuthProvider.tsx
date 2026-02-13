import { useState } from "react";
import type { ReactNode } from "react";
import api from "../api/axios";
import type { User } from "../types/user";
import { AuthContext } from "./AuthContext.ts"; // Import it now

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // 1. Create Form Data instead of a JSON object
    const params = new URLSearchParams();
    params.append('username', email); // OAuth2 standard uses 'username'
    params.append('password', password);

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
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};