// frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import apiService from '../services/apiService'; // Import your API service
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string; // Corresponds to full_name from backend
  email: string;
  role: 'user' | 'admin'; // Use string literals for roles
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  // You can add a reloadUser function if needed for profile updates
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true to check initial auth
  const navigate = useNavigate(); // For redirecting after login/logout

  const processLoginData = useCallback((token: string, userDataFromApi: any) => {
    localStorage.setItem('authToken', token);
    const loggedInUser: User = {
      id: userDataFromApi.id,
      name: userDataFromApi.full_name || "User",
      email: userDataFromApi.email,
      role: userDataFromApi.role,
    };
    localStorage.setItem('userData', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
    console.log("User logged in:", loggedInUser);
  }, []);


  // Check initial authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('userData');
      if (token && storedUser) {
        try {
          // Optionally: verify token with a silent /me call if it could have expired
          // const currentUserData = await apiService.getCurrentUser(); // This will use the stored token
          // processLoginData(token, currentUserData);
          // For now, trust localStorage for speed on initial load if token exists
          const parsedUser: User = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);

        } catch (error) {
          console.warn("Failed to verify stored token or user data, logging out:", error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [processLoginData]);


  const login = async (email: string, password_str: string) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(email, password_str);
      // Assuming /token now also returns user details OR we make a /me call
      let userData = response.user;
      if (!userData && response.access_token) { // If only token, fetch user details
         // Need to set token temporarily to make the getCurrentUser call authenticated
        localStorage.setItem('authToken', response.access_token);
        userData = await apiService.getCurrentUser();
      }
      
      if (userData) {
        processLoginData(response.access_token, userData);
      } else {
        throw new Error("Login successful, but no user data received.");
      }

    } catch (error) {
      console.error("Login failed:", error);
      setUser(null); // Clear any partial state
      setIsAuthenticated(false);
      throw error; // Re-throw for component to handle (e.g., show toast)
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password_str: string) => {
    try {
      setIsLoading(true);
      // Assumes your apiService.register calls a *public* registration endpoint
      // And that endpoint returns token and user data upon successful registration
      const response = await apiService.register(name, email, password_str);
      if (response.access_token && response.user) {
        processLoginData(response.access_token, response.user);
         // Navigate to dashboard or show success message for login
      } else {
        // If registration doesn't auto-login, handle accordingly
        // e.g., navigate to login page with a success message
        console.log("Registration successful. Please log in.");
        toast.success("Registration successful! Please log in.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAuthenticated(false);
    // Optionally: Call a backend /logout endpoint if it exists (e.g., to invalidate server-side session/token)
    navigate('/login'); // Redirect to login after logout
    console.log("User logged out");
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, isAdmin, login, logout, register }}>
      {!isLoading ? children : <div>Loading Application...</div> /* Or a proper spinner component */}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};