import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Settings, 
  Building2, 
  LogOut, 
  User,
  ArrowLeft,
  Activity,
  FileText
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export function Layout({ children, title, showBackButton = false }: LayoutProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleBack = () => {
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            {title && <h1 className="text-xl font-semibold">{title}</h1>}
          </div>

          {/* Center - Navigation */}
          <nav className="flex items-center gap-2">
            <Button
              variant={isActive('/') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/" className="gap-2">
                <Building2 className="h-4 w-4" />
                Buildings
              </Link>
            </Button>

            <Button
              variant={isActive('/devices') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/devices" className="gap-2">
                <Activity className="h-4 w-4" />
                Device View
              </Link>
            </Button>
            
            {isAdmin && (
              <Button
                variant={isActive('/management') ? 'default' : 'ghost'}
                size="sm"
                asChild
              >
                <Link to="/management" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Management
                </Link>
              </Button>
            )}
            
            <Button
              variant={isActive('/reports') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </Link>
            </Button>
            
            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </nav>

          {/* Right side - User menu */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {user?.email?.split('@')[0]}
              </span>
              {isAdmin && (
                <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
                  Admin
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}