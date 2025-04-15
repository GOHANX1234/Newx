import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export function AdminNav() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-primary text-transparent bg-clip-text">
                AsterialHack
              </h1>
            </div>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center">
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user?.username}</span>
              {user?.isAdmin && (
                <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold">
                  Administrator
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                className="ml-2 text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span className="sr-only">Logout</span>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="text-gray-300 hover:text-white focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, show/hide based on menu state */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="flex items-center justify-between px-3 py-2">
              <div>
                <span className="text-gray-300 block">{user?.username}</span>
                {user?.isAdmin && (
                  <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold mt-1 inline-block">
                    Administrator
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                className="text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
