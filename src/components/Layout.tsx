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
      {/* Top Navigation Bar */}
      <header className="fixed top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-20 md:h-24 items-center justify-between px-4">
          {/* Left side - Mobile menu & Back button */}
          <div className="flex items-center gap-4 md:gap-6">
            <MobileNav />
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            {title && <h1 className="text-base md:text-xl font-semibold truncate">{title}</h1>}
          </div>

          {/* Center - Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Button
              variant={isActive('/buildings') ? 'default' : 'ghost'}
              size="default"
              asChild
            >
              <Link to="/buildings" className="gap-2">
                <Building2 className="h-5 w-5" />
                <span className="text-base font-medium">Buildings</span>
              </Link>
            </Button>

            <Button
              variant={isActive('/devices') ? 'default' : 'ghost'}
              size="default"
              asChild
            >
              <Link to="/devices" className="gap-2">
                <Activity className="h-5 w-5" />
                <span className="text-base font-medium">Devices</span>
              </Link>
            </Button>
            
            {isAdmin && (
              <Button
                variant={isActive('/management') ? 'default' : 'ghost'}
                size="default"
                asChild
              >
                <Link to="/management" className="gap-2">
                  <Building2 className="h-5 w-5" />
                  <span className="text-base font-medium">Management</span>
                </Link>
              </Button>
            )}
            
            <Button
              variant={isReportsActive ? 'default' : 'ghost'}
              size="default"
              asChild
            >
              <Link to="/reports" className="gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-base font-medium">Reports</span>
              </Link>
            </Button>
            
            <Button
              variant={isActive('/alerts') ? 'default' : 'ghost'}
              size="default"
              asChild
            >
              <Link to="/alerts" className="gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-base font-medium">Alerts</span>
              </Link>
            </Button>

            {isAdmin && (
              <Button
                variant={isActive('/users') ? 'default' : 'ghost'}
                size="default"
                asChild
              >
                <Link to="/users" className="gap-2">
                  <Users className="h-5 w-5" />
                  <span className="text-base font-medium">Users</span>
                </Link>
              </Button>
            )}
            
            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              size="default"
              asChild
            >
              <Link to="/settings" className="gap-2">
                <Settings className="h-5 w-5" />
                <span className="text-base font-medium">Settings</span>
              </Link>
            </Button>
          </nav>

          {/* Right side - Logos & User menu (Desktop only) */}
          <div className="hidden md:flex items-center gap-4">
            {/* Abu Dhabi University Logo */}
            <img
              src="/logos/abu-dhabi-university.png"
              alt="Abu Dhabi University"
              className="h-12 md:h-16 object-contain"
              loading="lazy"
            />
            {/* ArcLight Logo */}
            <img
              src="/logos/arc-light-services.png"
              alt="ArcLight Services"
              className="h-12 md:h-16 object-contain"
              loading="lazy"
            />
            {/* ROSAIQ Logo */}
            <img
              src="/logos/rosaiq.png"
              alt="ROSAIQ"
              className="h-12 md:h-16 object-contain"
              loading="lazy"
            />
            <div className="flex items-center gap-2 text-base font-medium">
              <User className="h-5 w-5" />
              <span className="hidden lg:inline">
                {user?.email?.split('@')[0]}
              </span>
              {isAdmin && (
                <span className="rounded-md bg-primary px-2 py-1 text-sm text-primary-foreground font-medium">
                  Admin
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="default"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="h-5 w-5" />
              <span className="hidden lg:inline text-base font-medium">Sign Out</span>
            </Button>
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