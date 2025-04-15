import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useAuth } from "./hooks/useAuth";
import NotFound from "@/pages/not-found";
import AdminLogin from "@/pages/AdminLogin";
import ResellerLogin from "@/pages/ResellerLogin";
import ResellerRegister from "@/pages/ResellerRegister";
import AdminDashboard from "@/pages/AdminDashboard";
import ResellerDashboard from "@/pages/ResellerDashboard";

function Router() {
  const { user, isLoading, isError, userError } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Set a timeout to prevent indefinite loading state
  useEffect(() => {
    if (isLoading) {
      console.log("Auth loading state active");
      const timer = setTimeout(() => {
        console.log("Loading timeout triggered");
        setLoadingTimeout(true);
      }, 3000); // 3 seconds max loading time
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Log authentication status
  useEffect(() => {
    console.log("Auth state:", { 
      isLoading, 
      isError, 
      userError: userError ? `${userError}` : null,
      user: user ? `User: ${user.username} (${user.isAdmin ? 'Admin' : 'Reseller'})` : 'Not authenticated'
    });
  }, [user, isLoading, isError, userError]);

  // Show loading only if we're loading and haven't timed out
  if (isLoading && !loadingTimeout) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin mb-4"></div>
        <p className="text-gray-600">Loading authentication...</p>
      </div>
    );
  }
  
  // If there's an error or we timed out, treat as unauthenticated
  if (isError || loadingTimeout) {
    console.log("Error or timeout in authentication, treating as unauthenticated");
  }

  return (
    <Switch>
      {!user ? (
        <>
          <Route path="/" component={AdminLogin} />
          <Route path="/reseller/login" component={ResellerLogin} />
          <Route path="/reseller/register" component={ResellerRegister} />
        </>
      ) : user.isAdmin ? (
        <>
          <Route path="/" component={AdminDashboard} />
        </>
      ) : (
        <>
          <Route path="/" component={ResellerDashboard} />
        </>
      )}

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
