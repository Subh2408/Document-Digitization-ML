// InsureDocsProject/frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom'; // Outlet to render nested routes

// Assuming your AuthContext.tsx is in src/contexts/AuthContext.tsx
// and it exports a useAuth hook
// import { useAuth } from '../contexts/AuthContext'; 

// No props are strictly needed if useAuth() provides all necessary info,
// but children is implicitly passed if used as a wrapper.
// If ProtectedRoute wraps individual components (e.g. <ProtectedRoute><Dashboard/></ProtectedRoute>),
// you'd need: interface ProtectedRouteProps { children: JSX.Element; }
// const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {

// If ProtectedRoute is used as an element for a parent <Route> that has child <Route>s,
// it needs to render <Outlet />
interface ProtectedRouteProps {
    isAuthenticated: boolean;
    isLoading?: boolean; // Optional prop if App.tsx also manages loading
    children: React.ReactNode; // It will receive MainLayout as children
  }
  
  const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, isLoading, children }) => {
    const location = useLocation();
    // const { isAuthenticated, isLoading } = useAuth(); // Don't use this if props are passed
  
    if (isLoading) { // Check the isLoading prop passed from App.tsx
      return <div>Loading authentication...</div>; // Or a spinner
    }
  
    if (!isAuthenticated) { // Check the isAuthenticated prop
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  
    return <>{children}</>; // Render the children (which is MainLayout)
  };
  
  export default ProtectedRoute;