// frontend/src/pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle"; // Ensure this path is correct

const RegisterPage = () => { // Renamed component to RegisterPage for clarity if desired
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { register, isLoading: authIsLoading } = useAuth(); // Get register and auth loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) { // Example validation
        toast.error("Password must be at least 8 characters long.");
        return;
    }
    
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      // Navigation to dashboard/login is handled within AuthContext's register function or happens if isAuthenticated changes
      // Or, if register doesn't auto-login, it might have already shown a toast and redirected to /login
      // If register *does* auto-login and isAuthenticated updates, App.tsx logic will redirect
      toast.success("Registration initiated!"); // Can be more specific if context handles messages
      // No navigate("/dashboard") here if context/app handles it. If not, then:
      // navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard')
      // The best is usually if auth state change handles redirection
    } catch (error) {
      // Error toast is likely already handled by apiService or AuthContext
      // If not, uncomment and refine:
      // toast.error("Registration failed: " + (error instanceof Error ? error.message : "Unknown error"));
      console.error("Registration submission error:", error)
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageIsLoading = authIsLoading || isSubmitting;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#ff9a80]/30 to-[#4acfb6]/30 dark:from-[#072028] dark:to-[#0d3c46] p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-teal-500" />
            <h1 className="text-2xl font-bold">InsureDocs Portal</h1>
          </div>
          <ThemeToggle />
        </div>
        
        <Card className="dark:card-gradient border shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Create Account</CardTitle>
            <CardDescription className="text-center">
              Get started with your insurance documents portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">
                  Full Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={pageIsLoading}
                  className="block w-full dark:bg-gray-800/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={pageIsLoading}
                  className="block w-full dark:bg-gray-800/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={pageIsLoading}
                  className="block w-full dark:bg-gray-800/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={pageIsLoading}
                  className="block w-full dark:bg-gray-800/50"
                />
              </div>
              <Button
                type="submit"
                disabled={pageIsLoading}
                className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
              >
                {pageIsLoading ? "Processing..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-center w-full text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;