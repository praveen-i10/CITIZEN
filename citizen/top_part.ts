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
class CitizenDatabase {
  users: User[] = [];
  departments: Department[] = [];
  jurisdictionZones: JurisdictionZone[] = [];
  issues: Issue[] = [];
  complaints: Complaint[] = [];
  resolutionEvidence: ResolutionEvidence[] = [];
  statusHistory: StatusHistoryItem[] = [];
  notifications: NotificationItem[] = [];
  smsOutbox: SmsOutboxItem[] = [];

  private nextIssueId = 100;
  private nextComplaintId = 500;
  private nextResolutionId = 200;
  private nextHistoryId = 1000;
  private nextNotificationId = 3000;
  private nextSmsId = 8000;

  constructor() {
    this.resetToSeedData();
  }

  resetToSeedData() {
    this.users = JSON.parse(JSON.stringify(initialUsers));
    this.departments = JSON.parse(JSON.stringify(initialDepartments));
    this.jurisdictionZones = JSON.parse(JSON.stringify(initialJurisdictionZones));
    this.issues = [];
    this.complaints = [];
    this.resolutionEvidence = [];
    this.statusHistory = [];
    this.notifications = [];
    this.smsOutbox = [];

    // --- SEED ISSUES ---
    // 1. Lower Priority Issue: Minor Footpath slab issue in Besant Nagar (Adyar Zone 13)
    // Priority ~ 41.5. Exists so the demo pothole (priority ~ 83.5) clearly ranks ABOVE it!
    const seedIssue1: Issue = {
      id: 101,
      category: 'footpath',
      status: 'ongoing',
      jurisdictionZoneId: 1,
      jurisdictionZoneName: 'Zone 13 - Adyar (Demo)',
      wardLabel: 'Ward 175 (Adyar / Besant Nagar / Guindy)',
      departmentId: 1,
      departmentName: 'Roads & Infrastructure (Zone 13 Demo)',
      representativeLat: 13.0012,
      representativeLng: 80.2580,
      evidenceConfidenceBand: 'high',
      evidenceConfidenceScore: 0.85,
      priorityScore: 41.5,
      priorityBreakdown: {
        severity: 30, // Minor uneven slab
        publicExposure: 40,
        vulnerablePopulation: 50,
        criticalInfrastructure: 20,
        duration: 60,
        communityCorroboration: 25,
        recurrence: 30,
        evidenceConfidence: 85,
      },
      needsManualRouting: false,
      complaintCount: 1,
      independentReportersCount: 1,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      resolvedAt: null,
      closedAt: null,
    };

    const seedComplaint1: Complaint = {
      id: 501,
      referenceId: 'CVC-2026-000101',
      issueId: 101,
      reporterUserId: 2, // Karthik
      reporterName: 'Karthik Raja (Citizen B)',
      descriptionText: 'Cracked concrete slab on 4th Main Road footpath near park.',
      descriptionSource: 'typed',
      voiceLanguageCode: null,
      photoUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80',
      photoExifLat: 13.0012,
      photoExifLng: 80.2580,
      exifGpsMatch: 1,
      deviceGpsLat: 13.0012,
      deviceGpsLng: 80.2580,
      gpsIsApproximate: false,
      capturedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      aiSuggestedCategory: 'footpath',
      aiCategoryConfidence: 0.92,
      finalCategory: 'footpath',
      categorySource: 'ai_confirmed',
      syncStatus: 'submitted',
      duplicateLinkDecision: 'new_issue',
      isIndependentCorroboration: true,
      suspiciousFlag: false,
      createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    };

    // 2. Pre-seeded Hotspot Issue cluster (Mylapore garbage & drainage reports)
    const seedIssue2: Issue = {
      id: 102,
      category: 'garbage',
      status: 'submitted',
      jurisdictionZoneId: 2,
      jurisdictionZoneName: 'Zone 9 - Mylapore (Demo)',
      wardLabel: 'Ward 123 (Mylapore / Santhome)',
      departmentId: 2,
      departmentName: 'Solid Waste Management (Zone 13 Demo)',
      representativeLat: 13.0335,
      representativeLng: 80.2680,
      evidenceConfidenceBand: 'high',
      evidenceConfidenceScore: 0.90,
      priorityScore: 68.0,
      priorityBreakdown: {
        severity: 70,
        publicExposure: 85,
        vulnerablePopulation: 60,
        criticalInfrastructure: 40,
        duration: 75,
        communityCorroboration: 80,
        recurrence: 90,
        evidenceConfidence: 90,
      },
      needsManualRouting: false,
      complaintCount: 3,
      independentReportersCount: 3,
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      resolvedAt: null,
      closedAt: null,
    };

    const seedComplaint2: Complaint = {
      id: 502,
      referenceId: 'CVC-2026-000102',
      issueId: 102,
      reporterUserId: 1,
      reporterName: 'Priya Narayanan (Citizen A)',
      descriptionText: 'Overflowing commercial garbage bin near Luz Church Road market entrance.',
      descriptionSource: 'typed',
      photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
      deviceGpsLat: 13.0335,
      deviceGpsLng: 80.2680,
      gpsIsApproximate: false,
      capturedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
      aiSuggestedCategory: 'garbage',
      aiCategoryConfidence: 0.95,
      finalCategory: 'garbage',
      categorySource: 'ai_confirmed',
      syncStatus: 'submitted',
      duplicateLinkDecision: 'new_issue',
      isIndependentCorroboration: true,
      suspiciousFlag: false,
      createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    };

    // 3. Pre-seeded Streetlight issue in T. Nagar
    const seedIssue3: Issue = {
      id: 103,
      category: 'streetlight',
      status: 'resolved',
      jurisdictionZoneId: 3,
      jurisdictionZoneName: 'Zone 10 - T. Nagar (Demo)',
      wardLabel: 'Ward 134 (T. Nagar / Kodambakkam)',
      departmentId: 3,
      departmentName: 'Electrical & Streetlighting (Zone 13 Demo)',
      representativeLat: 13.0390,
      representativeLng: 80.2320,
      evidenceConfidenceBand: 'high',
      evidenceConfidenceScore: 0.95,
      priorityScore: 54.0,
      priorityBreakdown: {
        severity: 50,
        publicExposure: 70,
        vulnerablePopulation: 65,
        criticalInfrastructure: 40,
        duration: 30,
        communityCorroboration: 50,
        recurrence: 40,
        evidenceConfidence: 95,
      },
      needsManualRouting: false,
      complaintCount: 1,
      independentReportersCount: 1,
      createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      closedAt: null,
    };

    const seedComplaint3: Complaint = {
      id: 503,
      referenceId: 'CVC-2026-000103',
      issueId: 103,
      reporterUserId: 2,
      reporterName: 'Karthik Raja (Citizen B)',
      descriptionText: 'Non-functioning LED street fixture at North Usman Road junction.',
      descriptionSource: 'typed',
      photoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
      deviceGpsLat: 13.0390,
      deviceGpsLng: 80.2320,
      gpsIsApproximate: false,
      capturedAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      submittedAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
      finalCategory: 'streetlight',
      categorySource: 'ai_confirmed',
      syncStatus: 'submitted',
      isIndependentCorroboration: true,
      suspiciousFlag: false,
      createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(),
    };

    this.issues = [seedIssue1, seedIssue2, seedIssue3];
    this.complaints = [seedComplaint1, seedComplaint2, seedComplaint3];

    // Seed status histories
    this.statusHistory = [
      {
        id: 1001,
        issueId: 101,
        fromStatus: null,
        toStatus: 'submitted',
        changedByUserId: 2,
        changedByName: 'Karthik Raja',
        note: 'Initial citizen complaint submitted',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 1002,
        issueId: 101,
        fromStatus: 'submitted',
        toStatus: 'acknowledged',
        changedByUserId: 3,
        changedByName: 'Officer Ramesh Kumar',
        note: 'Assigned to Ward 175 maintenance crew',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: 1003,
        issueId: 101,
        fromStatus: 'acknowledged',
        toStatus: 'ongoing',
        changedByUserId: 3,
        changedByName: 'Officer Ramesh Kumar',
        note: 'Crew dispatched with replacement pavers',
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      },
      {
        id: 1004,
        issueId: 103,
        fromStatus: 'ongoing',
        toStatus: 'resolved',
        changedByUserId: 3,
        changedByName: 'Officer Ramesh Kumar',
        note: 'Driver replaced and LED bulb tested operational',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ];

    // Seed mock SMS outbox entries
    this.smsOutbox = [
      {
        id: 8001,
        notificationId: 3001,
        complaintReferenceId: 'CVC-2026-000101',
        toPhoneNumber: '+91 98402 34567',
        messageBody: 'CITIZEN: Your complaint CVC-2026-000101 has been registered and routed to Roads & Infrastructure (Zone 13).',
        sendStatus: 'sent_mock',
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
      {
        id: 8002,
        notificationId: 3002,
        complaintReferenceId: 'CVC-2026-000101',
        toPhoneNumber: '+91 98402 34567',
        messageBody: 'CITIZEN: Officer Ramesh has acknowledged your report CVC-2026-000101. Work scheduled.',
        sendStatus: 'sent_mock',
        createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
      },
      {
        id: 8003,
        notificationId: 3003,
        complaintReferenceId: 'CVC-2026-000103',
        toPhoneNumber: '+91 98402 34567',
        messageBody: 'CITIZEN: Issue CVC-2026-000103 has been marked RESOLVED with geo-verified proof. Please confirm in app.',
        sendStatus: 'sent_mock',
        createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      },
    ];
  }