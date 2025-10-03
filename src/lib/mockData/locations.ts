/**
 * Abu Dhabi University Location Structure
 * Aligned with Supabase database structure - without Blocks
 */

import { Site, Building, Floor, Room } from '@/hooks/useLocations';

export const mockSite: Site = {
  id: 'abu-dhabi-university',
  name: 'Abu Dhabi University Main Campus',
  address: 'Al Ain - Abu Dhabi Road, Abu Dhabi, UAE',
  description: 'Main campus of Abu Dhabi University with comprehensive facilities for students and faculty',
  latitude: 24.4539,
  longitude: 54.3773,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

export const mockBuildings: Building[] = [
  {
    id: 'building-engineering',
    site_id: mockSite.id,
    name: 'Engineering Building',
    description: 'Dedicated engineering labs and classrooms',
    floor_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'building-science',
    site_id: mockSite.id,
    name: 'Science Building',
    description: 'Science labs and classrooms',
    floor_count: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'building-library',
    site_id: mockSite.id,
    name: 'Library Building',
    description: 'Main library with study areas and classrooms',
    floor_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockFloors: Floor[] = [
  // Engineering Building floors
  {
    id: 'floor-engineering-1',
    building_id: 'building-engineering',
    floor_number: 1,
    name: 'First Floor',
    area_sqm: 1200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-engineering-2',
    building_id: 'building-engineering',
    floor_number: 2,
    name: 'Second Floor',
    area_sqm: 1200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-engineering-3',
    building_id: 'building-engineering',
    floor_number: 3,
    name: 'Third Floor',
    area_sqm: 1200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Science Building floors
  {
    id: 'floor-science-1',
    building_id: 'building-science',
    floor_number: 1,
    name: 'First Floor',
    area_sqm: 1000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-science-2',
    building_id: 'building-science',
    floor_number: 2,
    name: 'Second Floor',
    area_sqm: 1000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-science-4',
    building_id: 'building-science',
    floor_number: 4,
    name: 'Fourth Floor',
    area_sqm: 1000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Library Building floors
  {
    id: 'floor-library-2',
    building_id: 'building-library',
    floor_number: 2,
    name: 'Second Floor',
    area_sqm: 950,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockRooms: Room[] = [
  // Engineering Building - Floor 1
  {
    id: 'room-engineering-1-101',
    floor_id: 'floor-engineering-1',
    name: 'Classroom 101',
    description: 'Engineering classroom',
    room_number: '101',
    room_type: 'Classroom',
    capacity: 35,
    area_sqm: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-1-102',
    floor_id: 'floor-engineering-1',
    name: 'Classroom 102',
    description: 'Engineering classroom',
    room_number: '102',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-1-103',
    floor_id: 'floor-engineering-1',
    name: 'Classroom 103',
    description: 'Engineering classroom',
    room_number: '103',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-1-104',
    floor_id: 'floor-engineering-1',
    name: 'Classroom 104',
    description: 'Engineering classroom',
    room_number: '104',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Engineering Building - Floor 2
  {
    id: 'room-engineering-2-201',
    floor_id: 'floor-engineering-2',
    name: 'Classroom 201',
    description: 'Engineering classroom',
    room_number: '201',
    room_type: 'Classroom',
    capacity: 35,
    area_sqm: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-2-202',
    floor_id: 'floor-engineering-2',
    name: 'Classroom 202',
    description: 'Engineering classroom',
    room_number: '202',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-2-203',
    floor_id: 'floor-engineering-2',
    name: 'Classroom 203',
    description: 'Engineering classroom',
    room_number: '203',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-2-204',
    floor_id: 'floor-engineering-2',
    name: 'Classroom 204',
    description: 'Engineering classroom',
    room_number: '204',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Engineering Building - Floor 3
  {
    id: 'room-engineering-3-301',
    floor_id: 'floor-engineering-3',
    name: 'Classroom 301',
    description: 'Engineering classroom',
    room_number: '301',
    room_type: 'Classroom',
    capacity: 40,
    area_sqm: 80,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-3-302',
    floor_id: 'floor-engineering-3',
    name: 'Classroom 302',
    description: 'Engineering classroom',
    room_number: '302',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-3-303',
    floor_id: 'floor-engineering-3',
    name: 'Classroom 303',
    description: 'Engineering classroom',
    room_number: '303',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-3-304',
    floor_id: 'floor-engineering-3',
    name: 'Classroom 304',
    description: 'Engineering classroom',
    room_number: '304',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Science Building - Floor 1
  {
    id: 'room-science-1-101',
    floor_id: 'floor-science-1',
    name: 'Classroom 101',
    description: 'Science classroom',
    room_number: '101',
    room_type: 'Classroom',
    capacity: 35,
    area_sqm: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-1-102',
    floor_id: 'floor-science-1',
    name: 'Classroom 102',
    description: 'Science classroom',
    room_number: '102',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-1-103',
    floor_id: 'floor-science-1',
    name: 'Classroom 103',
    description: 'Science classroom',
    room_number: '103',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-1-104',
    floor_id: 'floor-science-1',
    name: 'Classroom 104',
    description: 'Science classroom',
    room_number: '104',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Science Building - Floor 2
  {
    id: 'room-science-2-201',
    floor_id: 'floor-science-2',
    name: 'Classroom 201',
    description: 'Science classroom',
    room_number: '201',
    room_type: 'Classroom',
    capacity: 35,
    area_sqm: 75,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-2-202',
    floor_id: 'floor-science-2',
    name: 'Classroom 202',
    description: 'Science classroom',
    room_number: '202',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-2-203',
    floor_id: 'floor-science-2',
    name: 'Classroom 203',
    description: 'Science classroom',
    room_number: '203',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-2-204',
    floor_id: 'floor-science-2',
    name: 'Classroom 204',
    description: 'Science classroom',
    room_number: '204',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Science Building - Floor 4
  {
    id: 'room-science-4-401',
    floor_id: 'floor-science-4',
    name: 'Classroom 401',
    description: 'Science classroom',
    room_number: '401',
    room_type: 'Classroom',
    capacity: 40,
    area_sqm: 80,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-4-402',
    floor_id: 'floor-science-4',
    name: 'Classroom 402',
    description: 'Science classroom',
    room_number: '402',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-4-403',
    floor_id: 'floor-science-4',
    name: 'Classroom 403',
    description: 'Science classroom',
    room_number: '403',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-science-4-404',
    floor_id: 'floor-science-4',
    name: 'Classroom 404',
    description: 'Science classroom',
    room_number: '404',
    room_type: 'Classroom',
    capacity: 30,
    area_sqm: 70,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Library Building - Floor 2
  {
    id: 'room-library-2-201',
    floor_id: 'floor-library-2',
    name: 'Classroom 201',
    description: 'Library classroom',
    room_number: '201',
    room_type: 'Classroom',
    capacity: 25,
    area_sqm: 65,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-library-2-202',
    floor_id: 'floor-library-2',
    name: 'Classroom 202',
    description: 'Library classroom',
    room_number: '202',
    room_type: 'Classroom',
    capacity: 25,
    area_sqm: 65,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-library-2-203',
    floor_id: 'floor-library-2',
    name: 'Classroom 203',
    description: 'Library classroom',
    room_number: '203',
    room_type: 'Classroom',
    capacity: 25,
    area_sqm: 65,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-library-2-204',
    floor_id: 'floor-library-2',
    name: 'Classroom 204',
    description: 'Library classroom',
    room_number: '204',
    room_type: 'Classroom',
    capacity: 25,
    area_sqm: 65,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockLocations = {
  sites: [mockSite],
  buildings: mockBuildings,
  floors: mockFloors,
  rooms: mockRooms
};
