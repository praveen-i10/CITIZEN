import {
  User,
  Department,
  JurisdictionZone,
  Issue,
  Complaint,
  ResolutionEvidence,
  StatusHistoryItem,
  NotificationItem,
  SmsOutboxItem,
  HotspotItem,
  IssueCategory,
  IssueStatus,
  EvidenceConfidenceBand,
  PriorityBreakdown,
  DuplicateCandidate,
} from '../types.js';

// --- CHENNAI DEMO JURISDICTION ZONES (DEC-09, 07_MAP_GIS_SPEC.md) ---
// Simplified bounding polygons in Chennai (Adyar, Mylapore, T. Nagar, Anna Nagar)
export const initialJurisdictionZones: JurisdictionZone[] = [
  {
    id: 1,
    zoneName: 'Zone 13 - Adyar (Demo)',
    localBodyType: 'corporation_zone',
    wardLabel: 'Ward 175 (Adyar / Besant Nagar / Guindy)',
    departmentId: 1, // Default to Roads & Infra
    boundaryGeojson: {
      type: 'Polygon',
      coordinates: [
        [
          [80.220, 13.010],
          [80.275, 13.010],
          [80.275, 12.980],
          [80.220, 12.980],
          [80.220, 13.010],
        ],
      ],
    },
    isDemoData: 1,
  },
  {
    id: 2,
    zoneName: 'Zone 9 - Mylapore (Demo)',
    localBodyType: 'corporation_zone',
    wardLabel: 'Ward 123 (Mylapore / Santhome)',
    departmentId: 1,
    boundaryGeojson: {
      type: 'Polygon',
      coordinates: [
        [
          [80.250, 13.045],
          [80.285, 13.045],
          [80.285, 13.015],
          [80.250, 13.015],
          [80.250, 13.045],
        ],
      ],
    },
    isDemoData: 1,
  },
  {
    id: 3,
    zoneName: 'Zone 10 - T. Nagar (Demo)',
    localBodyType: 'corporation_zone',
    wardLabel: 'Ward 134 (T. Nagar / Kodambakkam)',
    departmentId: 1,
    boundaryGeojson: {
      type: 'Polygon',
      coordinates: [
        [
          [80.210, 13.050],
          [80.250, 13.050],
          [80.250, 13.020],
          [80.210, 13.020],
          [80.210, 13.050],
        ],
      ],
    },
    isDemoData: 1,
  },
  {
    id: 4,
    zoneName: 'Zone 8 - Anna Nagar (Demo)',
    localBodyType: 'corporation_zone',
    wardLabel: 'Ward 102 (Anna Nagar West & East)',
    departmentId: 1,
    boundaryGeojson: {
      type: 'Polygon',
      coordinates: [
        [
          [80.190, 13.095],
          [80.235, 13.095],
          [80.235, 13.065],
          [80.190, 13.065],
          [80.190, 13.095],
        ],
      ],
    },
    isDemoData: 1,
  },
];

export const initialDepartments: Department[] = [
  {
    id: 1,
    name: 'Roads & Infrastructure (Zone 13 Demo)',
    categoryTypes: ['pothole', 'road_damage', 'footpath'],
    isDemoData: 1,
  },
  {
    id: 2,
    name: 'Solid Waste Management (Zone 13 Demo)',
    categoryTypes: ['garbage'],
    isDemoData: 1,
  },
  {
    id: 3,
    name: 'Electrical & Streetlighting (Zone 13 Demo)',
    categoryTypes: ['streetlight'],
    isDemoData: 1,
  },
  {
    id: 4,
    name: 'Water Supply & Drainage (Metro Water Demo)',
    categoryTypes: ['drainage', 'water_supply'],
    isDemoData: 1,
  },
  {
    id: 5,
    name: 'General Public Works & Amenities',
    categoryTypes: ['other'],
    isDemoData: 1,
  },
];

export const initialUsers: User[] = [
  {
    id: 1,
    role: 'citizen',
    displayName: 'Priya Narayanan (Citizen A)',
    phoneNumber: '+91 98401 23456',
    createdAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 2,
    role: 'citizen',
    displayName: 'Karthik Raja (Citizen B)',
    phoneNumber: '+91 98402 34567',
    createdAt: '2026-08-20T10:30:00Z',
  },
  {
    id: 3,
    role: 'officer',
    displayName: 'Officer Ramesh Kumar',
    phoneNumber: '+91 94440 11223',
    departmentId: 1, // Roads & Infra
    jurisdictionZoneId: 1, // Zone 13 Adyar
    createdAt: '2026-08-01T09:00:00Z',
  },
  {
    id: 4,
    role: 'admin',
    displayName: 'Dr. Sundar Murthy (Municipal Admin)',
    phoneNumber: '+91 94440 99887',
    createdAt: '2026-08-01T08:00:00Z',
  },
];

// In-Memory Database Storage
