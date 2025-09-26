import { z } from 'zod';

// ============= Device Schema =============

export const DeviceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Device name is required').max(100, 'Device name too long'),
  floor_id: z.string().uuid(),
  status: z.enum(['online', 'offline', 'maintenance']),
  mac_address: z.string().optional(),
  serial_number: z.string().optional(),
  firmware_version: z.string().optional(),
  installation_date: z.string().datetime().optional(),
  battery_level: z.number().min(0).max(100).optional(),
  signal_strength: z.number().min(-120).max(0).optional(),
  calibration_due_date: z.string().datetime().optional(),
});

export const CreateDeviceSchema = DeviceSchema.omit({ id: true });
export const UpdateDeviceSchema = DeviceSchema.partial().omit({ id: true });

// ============= Location Schemas =============

export const SiteSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Site name is required').max(100, 'Site name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().trim().min(1, 'Address is required').max(255, 'Address too long'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const BuildingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1, 'Building name is required').max(100, 'Building name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  site_id: z.string().uuid(),
  floor_count: z.number().min(1).max(200),
});

export const FloorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(100, 'Floor name too long').optional(),
  floor_number: z.number().min(-10).max(200),
  building_id: z.string().uuid().optional(),
  block_id: z.string().uuid().optional(),
  area_sqm: z.number().min(0).max(100000).optional(),
});

export const CreateSiteSchema = SiteSchema.omit({ id: true });
export const CreateBuildingSchema = BuildingSchema.omit({ id: true });
export const CreateFloorSchema = FloorSchema.omit({ id: true });

// ============= Sensor Data Schemas =============

export const SensorReadingSchema = z.object({
  id: z.string().uuid(),
  device_id: z.string().uuid(),
  sensor_type: z.enum(['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'temperature', 'humidity', 'voc', 'hcho', 'nox', 'no2', 'pc03', 'pc05', 'pc1', 'pc25', 'pc5', 'pc10']),
  value: z.number().min(0).max(100000),
  unit: z.string().trim().min(1).max(20),
  timestamp: z.string().datetime(),
});

export const CreateSensorReadingSchema = SensorReadingSchema.omit({ id: true });

// ============= Settings Schemas =============

export const ThresholdSchema = z.object({
  good: z.number().min(0),
  moderate: z.number().min(0),
  poor: z.number().min(0),
});

export const SettingsSchema = z.object({
  thresholds: z.record(z.string(), ThresholdSchema),
  unitSystem: z.enum(['metric', 'imperial']),
});

// ============= Alert Schemas =============

export const AlertSchema = z.object({
  id: z.string().uuid(),
  device_id: z.string().uuid(),
  sensor_type: z.enum(['pm03', 'pm1', 'pm25', 'pm5', 'pm10', 'co2', 'temperature', 'humidity', 'voc', 'hcho', 'nox', 'no2']),
  severity: z.enum(['critical', 'warning', 'info']),
  message: z.string().trim().min(1).max(1000),
  value: z.number().min(0),
  threshold_value: z.number().min(0),
  is_resolved: z.boolean(),
  resolved_at: z.string().datetime().optional(),
  resolved_by: z.string().uuid().optional(),
});

export const CreateAlertSchema = AlertSchema.omit({ id: true, resolved_at: true, resolved_by: true });

// ============= User Profile Schemas =============

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email address').max(255, 'Email too long'),
  first_name: z.string().trim().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().trim().min(1, 'Last name is required').max(50, 'Last name too long'),
  role: z.enum(['super_admin', 'admin', 'viewer']),
  department: z.string().trim().max(100, 'Department name too long').optional(),
  phone: z.string().trim().max(20, 'Phone number too long').optional(),
  is_active: z.boolean(),
});

export const UpdateProfileSchema = ProfileSchema.partial().omit({ id: true });

// ============= Export Types =============

export type Device = z.infer<typeof DeviceSchema>;
export type CreateDevice = z.infer<typeof CreateDeviceSchema>;
export type UpdateDevice = z.infer<typeof UpdateDeviceSchema>;

export type Site = z.infer<typeof SiteSchema>;
export type Building = z.infer<typeof BuildingSchema>;
export type Floor = z.infer<typeof FloorSchema>;

export type CreateSite = z.infer<typeof CreateSiteSchema>;
export type CreateBuilding = z.infer<typeof CreateBuildingSchema>;
export type CreateFloor = z.infer<typeof CreateFloorSchema>;

export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type CreateSensorReading = z.infer<typeof CreateSensorReadingSchema>;

export type Alert = z.infer<typeof AlertSchema>;
export type CreateAlert = z.infer<typeof CreateAlertSchema>;

export type Profile = z.infer<typeof ProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ============= Validation Utilities =============

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>'"]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}