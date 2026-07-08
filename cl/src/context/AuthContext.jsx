import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token   = localStorage.getItem("token");
    const profile = localStorage.getItem("userProfile");

    if (token && profile) {
      try {
        setUser(JSON.parse(profile));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userProfile) => {
    // Clear everything first so previous user's data is wiped
    localStorage.clear();
    localStorage.setItem("token", token);
    localStorage.setItem("userProfile", JSON.stringify(userProfile));
    setUser(userProfile);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = "/login";
  };

  const isLoggedIn = () => !!localStorage.getItem("token");

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, loading }}>
      {children}
    </AuthContext.Provider>
  );
};