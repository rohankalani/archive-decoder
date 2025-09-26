/**
 * User profiles mock data for Abu Dhabi University
 * Includes various university roles and realistic user data
 */

export interface MockProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  department?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MockNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  alert_id?: string;
  created_at: Date;
  updated_at: Date;
}

// University departments
const departments = [
  'Computer Science',
  'Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Environmental Sciences',
  'Facilities Management',
  'IT Services',
  'Health & Safety',
  'Administration'
];

// Generate realistic university users
export const generateMockUsers = (): MockProfile[] => {
  const users: MockProfile[] = [
    // Super Admin - IT Director
    {
      id: 'user-001',
      email: 'ahmad.hassan@adu.ac.ae',
      first_name: 'Ahmad',
      last_name: 'Hassan',
      phone: '+971-50-123-4567',
      department: 'IT Services',
      role: 'super_admin',
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // Admin - Facilities Manager
    {
      id: 'user-002',
      email: 'sara.almahmoud@adu.ac.ae',
      first_name: 'Sara',
      last_name: 'Al Mahmoud',
      phone: '+971-50-234-5678',
      department: 'Facilities Management',
      role: 'admin',
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // Admin - Environmental Safety Officer
    {
      id: 'user-003',
      email: 'omar.alzaabi@adu.ac.ae',
      first_name: 'Omar',
      last_name: 'Al Zaabi',
      phone: '+971-50-345-6789',
      department: 'Health & Safety',
      role: 'admin',
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date()
    },
    // Manager - Engineering Department Head
    {
      id: 'user-004',
      email: 'fatima.alshamsi@adu.ac.ae',
      first_name: 'Fatima',
      last_name: 'Al Shamsi',
      phone: '+971-50-456-7890',
      department: 'Engineering',
      role: 'manager',
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: new Date()
    },
    // Manager - Computer Science Department Head  
    {
      id: 'user-005',
      email: 'khalid.alnuaimi@adu.ac.ae',
      first_name: 'Khalid',
      last_name: 'Al Nuaimi',
      phone: '+971-50-567-8901',
      department: 'Computer Science',
      role: 'manager',
      is_active: true,
      created_at: new Date('2024-01-15'),
      updated_at: new Date()
    },
    // Viewers - Faculty and Staff
    {
      id: 'user-006',
      email: 'layla.alkindi@adu.ac.ae',
      first_name: 'Layla',
      last_name: 'Al Kindi',
      phone: '+971-50-678-9012',
      department: 'Environmental Sciences',
      role: 'viewer',
      is_active: true,
      created_at: new Date('2024-02-01'),
      updated_at: new Date()
    },
    {
      id: 'user-007',
      email: 'mohammed.alblooshi@adu.ac.ae',
      first_name: 'Mohammed',
      last_name: 'Al Blooshi',
      phone: '+971-50-789-0123',
      department: 'Physics',
      role: 'viewer',
      is_active: true,
      created_at: new Date('2024-02-01'),
      updated_at: new Date()
    },
    {
      id: 'user-008',
      email: 'aisha.almarzouqi@adu.ac.ae',
      first_name: 'Aisha',
      last_name: 'Al Marzouqi',
      phone: '+971-50-890-1234',
      department: 'Chemistry',
      role: 'viewer',
      is_active: true,
      created_at: new Date('2024-02-15'),
      updated_at: new Date()
    },
    {
      id: 'user-009',
      email: 'yusuf.alqasimi@adu.ac.ae',
      first_name: 'Yusuf',
      last_name: 'Al Qasimi',
      phone: '+971-50-901-2345',
      department: 'Business Administration',
      role: 'viewer',
      is_active: true,
      created_at: new Date('2024-02-15'),
      updated_at: new Date()
    },
    // Maintenance Staff
    {
      id: 'user-010',
      email: 'hassan.maintenance@adu.ac.ae',
      first_name: 'Hassan',
      last_name: 'Al Mansouri',
      phone: '+971-50-012-3456',
      department: 'Facilities Management',
      role: 'viewer',
      is_active: true,
      created_at: new Date('2024-01-20'),
      updated_at: new Date()
    },
    // Inactive user example
    {
      id: 'user-011',
      email: 'former.employee@adu.ac.ae',
      first_name: 'Former',
      last_name: 'Employee',
      phone: '+971-50-111-2222',
      department: 'Administration',
      role: 'viewer',
      is_active: false,
      created_at: new Date('2023-12-01'),
      updated_at: new Date('2024-03-01')
    }
  ];

  return users;
};

// Generate recent notifications for users
export const generateMockNotifications = (users: MockProfile[]): MockNotification[] => {
  const notifications: MockNotification[] = [];
  let notificationId = 1;

  users.filter(user => user.is_active).forEach(user => {
    // Generate 2-5 notifications per user
    const notificationCount = Math.floor(Math.random() * 4) + 2;
    
    for (let i = 0; i < notificationCount; i++) {
      const ageHours = Math.random() * 168; // Up to 7 days old
      const createdAt = new Date(Date.now() - ageHours * 60 * 60 * 1000);
      const isRead = Math.random() < 0.6; // 60% read rate
      
      // Generate different types of notifications based on role
      let notificationTemplate: { title: string; message: string; type: 'info' | 'warning' | 'success' | 'error'; alert_id?: string };
      
      if (user.role === 'super_admin' || user.role === 'admin') {
        const adminNotifications = [
          {
            title: 'System Alert',
            message: 'Critical air quality threshold exceeded in Engineering Lab',
            type: 'error' as const,
            alert_id: `alert-${Math.floor(Math.random() * 1000)}`
          },
          {
            title: 'Device Status',
            message: 'Air quality sensor in Library requires calibration',
            type: 'warning' as const
          },
          {
            title: 'Maintenance Completed',
            message: 'HVAC system maintenance completed in Building A',
            type: 'success' as const
          },
          {
            title: 'Monthly Report',
            message: 'Air quality monthly report is ready for review',
            type: 'info' as const
          },
          {
            title: 'New User Registration',
            message: 'New faculty member has requested access to the system',
            type: 'info' as const
          }
        ];
        notificationTemplate = adminNotifications[Math.floor(Math.random() * adminNotifications.length)];
      } else if (user.role === 'manager') {
        const managerNotifications = [
          {
            title: 'Department Alert',
            message: `Air quality levels in ${user.department} building require attention`,
            type: 'warning' as const
          },
          {
            title: 'Weekly Summary',
            message: 'Weekly air quality report for your department is available',
            type: 'info' as const
          },
          {
            title: 'Threshold Exceeded',
            message: 'CO2 levels in lecture hall exceeded recommended limits',
            type: 'warning' as const
          }
        ];
        notificationTemplate = managerNotifications[Math.floor(Math.random() * managerNotifications.length)];
      } else {
        const viewerNotifications = [
          {
            title: 'Air Quality Update',
            message: 'Current air quality in your area is Good',
            type: 'success' as const
          },
          {
            title: 'System Notice',
            message: 'Scheduled maintenance will occur this weekend',
            type: 'info' as const
          },
          {
            title: 'Alert Resolution',
            message: 'Previous air quality alert has been resolved',
            type: 'success' as const
          }
        ];
        notificationTemplate = viewerNotifications[Math.floor(Math.random() * viewerNotifications.length)];
      }

      notifications.push({
        id: `notification-${String(notificationId).padStart(3, '0')}`,
        user_id: user.id,
        title: notificationTemplate.title,
        message: notificationTemplate.message,
        type: notificationTemplate.type,
        alert_id: notificationTemplate.alert_id,
        is_read: isRead,
        created_at: createdAt,
        updated_at: isRead ? new Date(createdAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) : createdAt
      });
      
      notificationId++;
    }
  });

  return notifications.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
};

export const mockUsers = {
  generateMockUsers,
  generateMockNotifications,
  departments
};