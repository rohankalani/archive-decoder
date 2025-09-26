import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserPlus, Settings, Mail, Shield, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useEmailSettings } from '@/hooks/useEmailSettings';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type UserRole = 'viewer' | 'admin' | 'supervisor' | 'super_admin';

interface UserManagementProps {}

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Add User Form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('viewer');
  const [newUserDepartment, setNewUserDepartment] = useState('');

  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { users, isLoading: usersLoading, createUser, updateUser, deleteUser } = useUserManagement();
  const { emailSettings, isLoading: settingsLoading, updateEmailSetting } = useEmailSettings();

  const [adminEmail, setAdminEmail] = useState('');
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [alertThresholdHours, setAlertThresholdHours] = useState('1');

  React.useEffect(() => {
    if (emailSettings) {
      setAdminEmail(emailSettings.find(s => s.setting_key === 'admin_email')?.setting_value || '');
      setSupervisorEmail(emailSettings.find(s => s.setting_key === 'supervisor_email')?.setting_value || '');
      setAlertThresholdHours(emailSettings.find(s => s.setting_key === 'alert_threshold_hours')?.setting_value || '1');
    }
  }, [emailSettings]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserEmail || !newUserFirstName || !newUserLastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createUser({
        email: newUserEmail,
        first_name: newUserFirstName,
        last_name: newUserLastName,
        role: newUserRole,
        department: newUserDepartment,
      });
      
      setIsAddUserOpen(false);
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserRole('viewer');
      setNewUserDepartment('');
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      await updateUser(selectedUser.id, {
        first_name: selectedUser.first_name,
        last_name: selectedUser.last_name,
        role: selectedUser.role,
        department: selectedUser.department,
        is_active: selectedUser.is_active,
      });
      
      setIsEditUserOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteUser(userId);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleSaveEmailSettings = async () => {
    try {
      await Promise.all([
        updateEmailSetting('admin_email', adminEmail),
        updateEmailSetting('supervisor_email', supervisorEmail),
        updateEmailSetting('alert_threshold_hours', alertThresholdHours),
      ]);
      toast.success('Email settings saved successfully');
    } catch (error) {
      toast.error('Failed to save email settings');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'supervisor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (usersLoading || settingsLoading) {
    return (
      <div className="container mx-auto p-6">
        <LoadingSpinner className="w-8 h-8 mx-auto" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              You don't have permission to access user management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage users and system settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button 
          variant={activeTab === 'users' ? 'default' : 'outline'}
          onClick={() => setActiveTab('users')}
          className="justify-start"
        >
          <Users className="w-4 h-4 mr-2" />
          Users ({users?.length || 0})
        </Button>
        <Button 
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          onClick={() => setActiveTab('settings')}
          className="justify-start"
        >
          <Settings className="w-4 h-4 mr-2" />
          Email Settings
        </Button>
      </div>

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>System Users</CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </div>
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                      Create a new user account for the system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={newUserFirstName}
                          onChange={(e) => setNewUserFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={newUserLastName}
                          onChange={(e) => setNewUserLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUserEmail}
                        onChange={(e) => setNewUserEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={newUserRole} onValueChange={(value: UserRole) => setNewUserRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                          {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={newUserDepartment}
                        onChange={(e) => setNewUserDepartment(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create User</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditUserOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.id !== user?.id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Email Notification Settings</CardTitle>
            <CardDescription>
              Configure email addresses for automated alerts and reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@university.edu"
                />
                <p className="text-sm text-muted-foreground">
                  Receives critical alerts and system notifications
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">Supervisor Email</Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  value={supervisorEmail}
                  onChange={(e) => setSupervisorEmail(e.target.value)}
                  placeholder="supervisor@university.edu"
                />
                <p className="text-sm text-muted-foreground">
                  Receives monthly reports and prolonged alerts
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="alertThreshold">Alert Threshold (Hours)</Label>
              <Select value={alertThresholdHours} onValueChange={setAlertThresholdHours}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">30 minutes</SelectItem>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="8">8 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Send email alerts when pollutants stay in red category for this duration
              </p>
            </div>

            <Button onClick={handleSaveEmailSettings}>
              <Mail className="w-4 h-4 mr-2" />
              Save Email Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={selectedUser.first_name}
                    onChange={(e) => setSelectedUser({...selectedUser, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={selectedUser.last_name}
                    onChange={(e) => setSelectedUser({...selectedUser, last_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value: UserRole) => setSelectedUser({...selectedUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    {isSuperAdmin && <SelectItem value="admin">Admin</SelectItem>}
                    {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDepartment">Department</Label>
                <Input
                  id="editDepartment"
                  value={selectedUser.department || ''}
                  onChange={(e) => setSelectedUser({...selectedUser, department: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update User</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}