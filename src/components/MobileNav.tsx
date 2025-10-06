import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogoBanner } from '@/components/LogoBanner';
import { 
  Menu,
  Building2, 
  Activity,
  FileText,
  AlertTriangle,
  Users,
  Settings,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  const navItems = [
    { path: '/buildings', icon: Building2, label: 'Buildings', adminOnly: false },
    { path: '/devices', icon: Activity, label: 'Device View', adminOnly: false },
    { path: '/management', icon: Building2, label: 'Management', adminOnly: true },
    { path: '/reports', icon: FileText, label: 'Reports', adminOnly: false },
    { path: '/alerts', icon: AlertTriangle, label: 'Alerts', adminOnly: false },
    { path: '/users', icon: Users, label: 'Users', adminOnly: true },
    { path: '/settings', icon: Settings, label: 'Settings', adminOnly: false },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="py-4 px-6 border-b">
          <LogoBanner variant="mobile" />
        </div>
        <SheetHeader className="border-b p-6">
          <SheetTitle className="text-left">Navigation</SheetTitle>
          <div className="flex items-center gap-2 text-sm pt-2">
            <User className="h-4 w-4" />
            <span>{user?.email?.split('@')[0]}</span>
            {isAdmin && (
              <span className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground">
                Admin
              </span>
            )}
          </div>
        </SheetHeader>
        
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null;
            
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
