/**
 * Abu Dhabi University Location Structure
 * Aligned with Supabase database structure
 */

import { Site, Building, Block, Floor, Room } from '@/hooks/useLocations';

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
    id: 'building-academic-1',
    site_id: mockSite.id,
    name: 'Academic Building 1',
    description: 'Main academic building with lecture halls and classrooms',
    floor_count: 4,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'building-engineering',
    site_id: mockSite.id,
    name: 'Engineering Building',
    description: 'Dedicated engineering labs and workshops',
    floor_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'building-library',
    site_id: mockSite.id,
    name: 'Central Library',
    description: 'Main library with study areas and resources',
    floor_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'building-admin',
    site_id: mockSite.id,
    name: 'Administration Building',
    description: 'Administrative offices and student services',
    floor_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'building-student-center',
    site_id: mockSite.id,
    name: 'Student Center',
    description: 'Student activities, cafeteria, and recreation facilities',
    floor_count: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockBlocks: Block[] = [
  // Academic Building 1 - North and South wings
  {
    id: 'block-academic-1-north',
    building_id: 'building-academic-1',
    name: 'North Wing',
    description: 'Mathematics and Science departments',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'block-academic-1-south',
    building_id: 'building-academic-1',
    name: 'South Wing',
    description: 'Business and Humanities departments',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Engineering Building blocks
  {
    id: 'block-engineering-lab',
    building_id: 'building-engineering',
    name: 'Laboratory Block',
    description: 'Engineering laboratories and research facilities',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockFloors: Floor[] = [
  // Academic Building 1 - North Wing floors
  {
    id: 'floor-academic-1-north-gf',
    building_id: 'building-academic-1',
    block_id: 'block-academic-1-north',
    floor_number: 0,
    name: 'Ground Floor - North',
    area_sqm: 800,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-academic-1-north-1',
    building_id: 'building-academic-1',
    block_id: 'block-academic-1-north',
    floor_number: 1,
    name: 'First Floor - North',
    area_sqm: 800,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-academic-1-north-2',
    building_id: 'building-academic-1',
    block_id: 'block-academic-1-north',
    floor_number: 2,
    name: 'Second Floor - North',
    area_sqm: 800,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Academic Building 1 - South Wing floors
  {
    id: 'floor-academic-1-south-gf',
    building_id: 'building-academic-1',
    block_id: 'block-academic-1-south',
    floor_number: 0,
    name: 'Ground Floor - South',
    area_sqm: 750,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-academic-1-south-1',
    building_id: 'building-academic-1',
    block_id: 'block-academic-1-south',
    floor_number: 1,
    name: 'First Floor - South',
    area_sqm: 750,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Engineering Building floors
  {
    id: 'floor-engineering-lab-gf',
    building_id: 'building-engineering',
    block_id: 'block-engineering-lab',
    floor_number: 0,
    name: 'Ground Floor - Labs',
    area_sqm: 1200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-engineering-lab-1',
    building_id: 'building-engineering',
    block_id: 'block-engineering-lab',
    floor_number: 1,
    name: 'First Floor - Labs',
    area_sqm: 1200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Library floors (without blocks)
  {
    id: 'floor-library-gf',
    building_id: 'building-library',
    block_id: null,
    floor_number: 0,
    name: 'Ground Floor',
    area_sqm: 1000,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-library-1',
    building_id: 'building-library',
    block_id: null,
    floor_number: 1,
    name: 'First Floor',
    area_sqm: 950,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'floor-library-2',
    building_id: 'building-library',
    block_id: null,
    floor_number: 2,
    name: 'Second Floor',
    area_sqm: 950,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockRooms: Room[] = [
  // Academic Building 1 - North Wing Ground Floor
  {
    id: 'room-academic-1-north-gf-101',
    floor_id: 'floor-academic-1-north-gf',
    name: 'Lecture Hall 101',
    description: 'Large lecture hall for mathematics courses',
    room_number: '101',
    room_type: 'Lecture Hall',
    capacity: 150,
    area_sqm: 200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-academic-1-north-gf-102',
    floor_id: 'floor-academic-1-north-gf',
    name: 'Classroom 102',
    description: 'Standard classroom for small group sessions',
    room_number: '102',
    room_type: 'Classroom',
    capacity: 40,
    area_sqm: 80,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-academic-1-north-gf-103',
    floor_id: 'floor-academic-1-north-gf',
    name: 'Physics Lab',
    description: 'Physics laboratory with experimental equipment',
    room_number: '103',
    room_type: 'Laboratory',
    capacity: 30,
    area_sqm: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Academic Building 1 - North Wing First Floor
  {
    id: 'room-academic-1-north-1-201',
    floor_id: 'floor-academic-1-north-1',
    name: 'Chemistry Lab',
    description: 'Advanced chemistry laboratory with fume hoods',
    room_number: '201',
    room_type: 'Laboratory',
    capacity: 25,
    area_sqm: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-academic-1-north-1-202',
    floor_id: 'floor-academic-1-north-1',
    name: 'Computer Lab',
    description: 'Computer laboratory with 50 workstations',
    room_number: '202',
    room_type: 'Computer Lab',
    capacity: 50,
    area_sqm: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Academic Building 1 - South Wing Ground Floor
  {
    id: 'room-academic-1-south-gf-301',
    floor_id: 'floor-academic-1-south-gf',
    name: 'Business Classroom 301',
    description: 'Business studies classroom with presentation equipment',
    room_number: '301',
    room_type: 'Classroom',
    capacity: 45,
    area_sqm: 85,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-academic-1-south-gf-302',
    floor_id: 'floor-academic-1-south-gf',
    name: 'Seminar Room 302',
    description: 'Small seminar room for group discussions',
    room_number: '302',
    room_type: 'Seminar Room',
    capacity: 20,
    area_sqm: 50,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Engineering Building Ground Floor
  {
    id: 'room-engineering-lab-gf-401',
    floor_id: 'floor-engineering-lab-gf',
    name: 'Mechanical Workshop',
    description: 'Mechanical engineering workshop with machine tools',
    room_number: '401',
    room_type: 'Workshop',
    capacity: 20,
    area_sqm: 200,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-engineering-lab-gf-402',
    floor_id: 'floor-engineering-lab-gf',
    name: 'Electronics Lab',
    description: 'Electronics laboratory with testing equipment',
    room_number: '402',
    room_type: 'Laboratory',
    capacity: 25,
    area_sqm: 120,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  // Library Ground Floor
  {
    id: 'room-library-gf-501',
    floor_id: 'floor-library-gf',
    name: 'Main Reading Hall',
    description: 'Large reading hall with study desks',
    room_number: '501',
    room_type: 'Reading Room',
    capacity: 200,
    area_sqm: 400,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'room-library-gf-502',
    floor_id: 'floor-library-gf',
    name: 'Reference Section',
    description: 'Reference books and research materials',
    room_number: '502',
    room_type: 'Reference Room',
    capacity: 50,
    area_sqm: 150,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

export const mockLocations = {
  sites: [mockSite],
  buildings: mockBuildings,
  blocks: mockBlocks,
  floors: mockFloors,
  rooms: mockRooms
};