import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, CircleDollarSign } from "lucide-react";

export function ResellerNav() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Key Management System</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
              <CircleDollarSign className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-gray-700">Credits: {user?.credits || 0}</span>
            </div>
            <span className="text-gray-700 mr-2">{user?.username}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              className="ml-3 bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <span className="sr-only">Logout</span>
              <LogOut className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
