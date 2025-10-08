import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MobileNav } from '@/components/MobileNav';
import { LogoBanner } from '@/components/LogoBanner';
import { 
  Settings, 
  Building2, 
  LogOut, 
  User,
  ArrowLeft,
  Activity,
  FileText,
  AlertTriangle,
  Users
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
    navigate('/devices');
  };

  const isActive = (path: string) => location.pathname === path;
  const isReportsActive = location.pathname.startsWith('/reports');

  return (
    <div className="min-h-screen bg-background">
      {/* Modern Top Navigation Bar */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/70 shadow-lg">
        <div className="container mx-auto px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left side - Logo & Title */}
            <div className="flex items-center gap-6">
              <MobileNav />
              <div className="flex items-center gap-3">
                <img
                  src="/logos/rosaiq.png"
                  alt="ROSAIQ"
                  className="h-8 w-auto object-contain hidden sm:block"
                  loading="lazy"
                />
                {showBackButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="gap-2 h-9"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Back</span>
                  </Button>
                )}
                {title && (
                  <h1 className="text-lg font-semibold text-foreground truncate">
                    {title}
                  </h1>
                )}
              </div>
            </div>

            {/* Center - Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-muted/30 rounded-full px-2 py-1.5">
              <Button
                variant={isActive('/buildings') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="rounded-full h-9 px-4"
              >
                <Link to="/buildings" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="font-medium">Buildings</span>
                </Link>
              </Button>

              <Button
                variant={isActive('/devices') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="rounded-full h-9 px-4"
              >
                <Link to="/devices" className="gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">Devices</span>
                </Link>
              </Button>
              
              {isAdmin && (
                <Button
                  variant={isActive('/management') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="rounded-full h-9 px-4"
                >
                  <Link to="/management" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">Management</span>
                  </Link>
                </Button>
              )}
              
              <Button
                variant={isReportsActive ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="rounded-full h-9 px-4"
              >
                <Link to="/reports" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Reports</span>
                </Link>
              </Button>
              
              <Button
                variant={isActive('/alerts') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="rounded-full h-9 px-4"
              >
                <Link to="/alerts" className="gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Alerts</span>
                </Link>
              </Button>

              {isAdmin && (
                <Button
                  variant={isActive('/users') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="rounded-full h-9 px-4"
                >
                  <Link to="/users" className="gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Users</span>
                  </Link>
                </Button>
              )}
              
              <Button
                variant={isActive('/settings') ? 'default' : 'ghost'}
                size="sm"
                asChild
                className="rounded-full h-9 px-4"
              >
                <Link to="/settings" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">Settings</span>
                </Link>
              </Button>
            </nav>

            {/* Right side - Partner Logos & User */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="flex items-center gap-3 border-l border-border/50 pl-4">
                <img
                  src="/logos/abu-dhabi-university.png"
                  alt="Abu Dhabi University"
                  className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <img
                  src="/logos/arc-light-services.png"
                  alt="ArcLight Services"
                  className="h-10 object-contain opacity-90 hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
              </div>
              
              <div className="flex items-center gap-3 border-l border-border/50 pl-4">
                <div className="flex items-center gap-2 bg-muted/30 rounded-full px-3 py-1.5">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium hidden xl:inline">
                    {user?.email?.split('@')[0]}
                  </span>
                  {isAdmin && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs text-primary-foreground font-semibold">
                      Admin
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="gap-2 h-9 rounded-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline font-medium">Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-4 md:py-6 pt-24 md:pt-28 px-4">
        {children}
      </main>
    </div>
  );
}