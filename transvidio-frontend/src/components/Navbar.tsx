import { Moon, Sun, Video, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
// import useAuth from "@/hooks/use-auth";

export const Navbar = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  // const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const handleLoginClick = () => {
    window.location.href = `/auth?redirect=${encodeURIComponent(window.location.pathname)}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-600/40">
              <Video className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-400 dark:to-yellow-500 bg-clip-text text-transparent">
              TransVidio
            </span>
          </div>

          {/* Right side - Theme toggle & Auth */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="transition-transform hover:scale-110"
            >
              {mounted ? (
                <>
                  <Sun
                    className={`h-5 w-5 transition-opacity ${resolvedTheme === "light"
                      ? "opacity-100 text-ring"
                      : "opacity-0"
                      }`}
                  />
                  <Moon
                    className={`absolute h-5 w-5 transition-opacity ${resolvedTheme === "dark"
                      ? "opacity-100 text-ring"
                      : "opacity-0"
                      }`}
                  />
                </>
              ) : (
                <Sun className="h-5 w-5 text-card-foreground" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>


            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  aria-label="User menu"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {/* {user.name || "User"} */}
                  </span>
                </Button>
              </DropdownMenuTrigger>


            </DropdownMenu>


          </div>
        </div>
      </div>
    </nav>
  );
};
