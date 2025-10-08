import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, Clock, MapPin, CheckCircle, Users, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { useAlerts } from '@/hooks/useAlerts';
import { useNotifications } from '@/hooks/useNotifications';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/Layout';

interface AlertsProps {}

export default function Alerts() {
  const [activeTab, setActiveTab] = useState('alerts');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  const { user, isAdmin } = useAuth();
  const { alerts, isLoading: alertsLoading, resolveAlert } = useAlerts();
  const { notifications, isLoading: notificationsLoading, markAsRead } = useNotifications();

  const filteredAlerts = alerts?.filter(alert => {
    if (filterStatus !== 'all' && (alert.is_resolved ? 'resolved' : 'active') !== filterStatus) return false;
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    return true;
  }) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityTextColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'info': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!user) return;
    await resolveAlert(alertId, user.id);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  if (alertsLoading || notificationsLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <LoadingSpinner className="w-8 h-8 mx-auto" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts & Notifications</h1>
          <p className="text-muted-foreground">
            Monitor air quality alerts and system notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-red-600">
            {alerts?.filter(a => !a.is_resolved && a.severity === 'critical').length || 0} Critical
          </Badge>
          <Badge variant="outline" className="text-orange-600">
            {alerts?.filter(a => !a.is_resolved && a.severity === 'high').length || 0} High
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Alerts ({alerts?.filter(a => !a.is_resolved).length || 0})
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifications ({notifications?.filter(n => !n.is_read).length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Alerts</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                  <p className="text-muted-foreground">
                    {filterStatus === 'all' 
                      ? "There are no alerts matching your current filters."
                      : filterStatus === 'active' 
                      ? "There are no active alerts at the moment."
                      : "There are no resolved alerts matching your filters."
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityTextColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {alert.sensor_type.toUpperCase()}
                          </Badge>
                          {alert.is_resolved && (
                            <Badge variant="outline" className="text-green-600 bg-green-50">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{alert.message}</CardTitle>
                      </div>
                      {!alert.is_resolved && isAdmin && (
                        <Button 
                          size="sm" 
                          onClick={() => handleResolveAlert(alert.id)}
                          className="ml-4"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        <span>Value: {alert.value} (Threshold: {alert.threshold_value})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>Device: {alert.device_id.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(alert.created_at), 'MMM dd, HH:mm')}</span>
                      </div>
                      {alert.is_resolved && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Resolved: {format(new Date(alert.resolved_at!), 'MMM dd, HH:mm')}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-4">
            {notifications?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No notifications</h3>
                  <p className="text-muted-foreground">
                    You don't have any notifications at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              notifications?.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50 border-blue-200' : ''
                  }`}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className={getNotificationTypeColor(notification.type)}>
                            {notification.type.toUpperCase()}
                          </Badge>
                          {!notification.is_read && (
                            <Badge className="bg-blue-500 text-white">New</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{notification.message}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}