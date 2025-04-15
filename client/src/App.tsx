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
  const { user, isLoading } = useAuth();

  // Don't show loading spinner indefinitely if there are authentication issues
  // Instead, default to unauthenticated state after a brief loading period
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-primary border-b-transparent border-l-transparent animate-spin"></div>
      </div>
    );
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
