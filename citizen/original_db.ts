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

  // --- GIS HELPER ALGORITHMS (07_MAP_GIS_SPEC.md) ---

  // Haversine formula for distance in meters
  getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  // Ray-casting point-in-polygon algorithm
  isPointInPolygon(lat: number, lng: number, polygonCoords: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
      const xi = polygonCoords[i][0]; // lng
      const yi = polygonCoords[i][1]; // lat
      const xj = polygonCoords[j][0];
      const yj = polygonCoords[j][1];

      const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Jurisdiction lookup algorithm (07_MAP_GIS_SPEC.md §4)
  lookupJurisdiction(
    lat: number,
    lng: number,
    category: IssueCategory
  ): { zone: JurisdictionZone | null; department: Department | null } {
    let matchedZone: JurisdictionZone | null = null;

    for (const zone of this.jurisdictionZones) {
      if (this.isPointInPolygon(lat, lng, zone.boundaryGeojson.coordinates[0])) {
        matchedZone = zone;
        break;
      }
    }

    // If outside explicit polygons, find nearest zone within Chennai demo scope
    if (!matchedZone && this.jurisdictionZones.length > 0) {
      let minDistance = Infinity;
      for (const zone of this.jurisdictionZones) {
        const centerLng =
          (zone.boundaryGeojson.coordinates[0][0][0] + zone.boundaryGeojson.coordinates[0][2][0]) / 2;
        const centerLat =
          (zone.boundaryGeojson.coordinates[0][0][1] + zone.boundaryGeojson.coordinates[0][2][1]) / 2;
        const d = this.getDistanceMeters(lat, lng, centerLat, centerLng);
        if (d < minDistance && d < 12000) {
          // Within 12km of demo center
          minDistance = d;
          matchedZone = zone;
        }
      }
    }

    if (!matchedZone) {
      return { zone: null, department: null };
    }

    // Resolve department for category
    const matchedDept =
      this.departments.find((dept) => dept.categoryTypes.includes(category)) ||
      this.departments.find((dept) => dept.id === matchedZone!.departmentId) ||
      this.departments[0];

    return { zone: matchedZone, department: matchedDept };
  }

  // Duplicate detection algorithm (75m demo radius + category match - 07_MAP_GIS_SPEC.md §5)
  findDuplicateCandidate(
    lat: number,
    lng: number,
    category: IssueCategory,
    excludeIssueId?: number
  ): DuplicateCandidate | null {
    const DUPLICATE_RADIUS_METERS = 75;

    let closestCandidate: DuplicateCandidate | null = null;
    let minDistance = Infinity;

    for (const issue of this.issues) {
      if (excludeIssueId && issue.id === excludeIssueId) continue;
      if (issue.status === 'closed') continue;

      if (issue.category === category) {
        const dist = this.getDistanceMeters(lat, lng, issue.representativeLat, issue.representativeLng);
        if (dist <= DUPLICATE_RADIUS_METERS && dist < minDistance) {
          minDistance = dist;
          const firstComplaint = this.complaints.find((c) => c.issueId === issue.id);
          closestCandidate = {
            issueId: issue.id,
            distanceM: dist,
            category: issue.category,
            existingComplaintCount: issue.complaintCount,
            representativeLat: issue.representativeLat,
            representativeLng: issue.representativeLng,
            photoUrl: firstComplaint?.photoUrl,
          };
        }
      }
    }

    return closestCandidate;
  }

  // Calculate Evidence Confidence (03_FEATURE_SPEC.md F-08, 04_DATABASE.md)
  calculateEvidenceConfidence(
    hasPhoto: boolean,
    hasValidGps: boolean,
    exifMatch: boolean | null,
    independentReportersCount: number
  ): { score: number; band: EvidenceConfidenceBand } {
    let score = 0;
    if (hasPhoto) score += 0.35;
    if (hasValidGps) score += 0.25;
    if (exifMatch === true) score += 0.10;
    // Add corroboration signals
    if (independentReportersCount >= 2) score += 0.20;
    if (independentReportersCount >= 3) score += 0.10;

    score = Math.min(1.0, Math.max(0.1, score));
    let band: EvidenceConfidenceBand = 'low';
    if (score >= 0.70) band = 'high';
    else if (score >= 0.40) band = 'needs_verification';

    return { score: Number(score.toFixed(2)), band };
  }

  // Calculate 8-Factor Deterministic Risk / Priority Score (03_FEATURE_SPEC.md F-09, DEC-17)
  calculatePriorityScore(
    category: IssueCategory,
    evidenceConfidenceScore: number,
    independentReportersCount: number,
    durationHours: number,
    isReopened: boolean
  ): { score: number; breakdown: PriorityBreakdown } {
    // 1. Severity (wt: 20%)
    let severity = 50;
    if (category === 'pothole') severity = 85;
    else if (category === 'drainage') severity = 80;
    else if (category === 'road_damage') severity = 75;
    else if (category === 'garbage') severity = 65;
    else if (category === 'streetlight') severity = 50;
    else if (category === 'footpath') severity = 35;
    else severity = 40;

    // 2. Public Exposure (wt: 15%) - main road junction traffic factor
    const publicExposure = category === 'pothole' || category === 'road_damage' ? 85 : 60;

    // 3. Vulnerable Population Impact (wt: 15%) - pedestrian/school/elderly hazard
    const vulnerablePopulation =
      category === 'pothole' || category === 'drainage' || category === 'footpath' ? 80 : 50;

    // 4. Critical Infrastructure Impact (wt: 10%) - bus routes, hospitals
    const criticalInfrastructure = category === 'pothole' || category === 'water_supply' ? 75 : 40;

    // 5. Duration (wt: 10%) - increases with age or reopening
    let duration = Math.min(100, Math.round(durationHours * 1.5 + (isReopened ? 35 : 0)));
    duration = Math.max(20, duration);

    // 6. Community Corroboration (wt: 10%) - independent reporters
    const communityCorroboration = Math.min(100, independentReportersCount * 45);

    // 7. Recurrence (wt: 10%)
    const recurrence = category === 'pothole' || category === 'drainage' ? 70 : 40;

    // 8. Evidence Confidence (wt: 10%)
    const evidenceConfidence = Math.round(evidenceConfidenceScore * 100);

    const weightedScore =
      severity * 0.20 +
      publicExposure * 0.15 +
      vulnerablePopulation * 0.15 +
      criticalInfrastructure * 0.10 +
      duration * 0.10 +
      communityCorroboration * 0.10 +
      recurrence * 0.10 +
      evidenceConfidence * 0.10;

    const finalScore = Number(Math.min(100, Math.max(10, weightedScore)).toFixed(1));

    return {
      score: finalScore,
      breakdown: {
        severity,
        publicExposure,
        vulnerablePopulation,
        criticalInfrastructure,
        duration,
        communityCorroboration,
        recurrence,
        evidenceConfidence,
      },
    };
  }

  // Log SMS to mock outbox and dispatch status notification (F-11)
  sendStageNotification(complaintId: number, stage: IssueStatus, customNote?: string) {
    const complaint = this.complaints.find((c) => c.id === complaintId);
    if (!complaint) return;

    const user = this.users.find((u) => u.id === complaint.reporterUserId);
    const toPhone = user?.phoneNumber || '+91 98400 00000';

    const notifId = this.nextNotificationId++;
    this.notifications.push({
      id: notifId,
      complaintId,
      stage,
      createdAt: new Date().toISOString(),
    });

    let message = `CITIZEN [${complaint.referenceId}]: Status updated to ${stage.toUpperCase()}.`;
    if (stage === 'submitted') {
      message = `CITIZEN: Your report ${complaint.referenceId} (${complaint.finalCategory}) has been successfully submitted and geo-routed.`;
    } else if (stage === 'acknowledged') {
      message = `CITIZEN: Officer Ramesh has acknowledged your report ${complaint.referenceId}. Department review complete.`;
    } else if (stage === 'ongoing') {
      message = `CITIZEN: Work is ONGOING for ${complaint.referenceId}. Maintenance crew is on-site.`;
    } else if (stage === 'resolved') {
      message = `CITIZEN: Issue ${complaint.referenceId} has been marked RESOLVED with geo-verified proof. Please confirm resolution in app.`;
    } else if (stage === 'reopened') {
      message = `CITIZEN: Issue ${complaint.referenceId} has been REOPENED upon citizen request: ${customNote || 'Needs further work'}.`;
    } else if (stage === 'closed') {
      message = `CITIZEN: Thank you! Resolution for ${complaint.referenceId} has been confirmed by citizen. Ticket closed.`;
    } else if (stage === 'needs_verification') {
      message = `CITIZEN: Resolution proof for ${complaint.referenceId} has been submitted and queued for verification.`;
    }

    const smsId = this.nextSmsId++;
    this.smsOutbox.unshift({
      id: smsId,
      notificationId: notifId,
      complaintReferenceId: complaint.referenceId,
      toPhoneNumber: toPhone,
      messageBody: message,
      sendStatus: 'sent_mock',
      createdAt: new Date().toISOString(),
    });
  }

  // Create new Complaint and link/create Issue
  createComplaint(params: {
    reporterUserId: number;
    descriptionText: string;
    descriptionSource: 'typed' | 'voice_transcript';
    voiceLanguageCode?: string | null;
    photoUrl: string;
    photoExifLat?: number | null;
    photoExifLng?: number | null;
    deviceGpsLat: number | null;
    deviceGpsLng: number | null;
    gpsIsApproximate?: boolean;
    capturedAt: string;
    aiSuggestedCategory?: IssueCategory | null;
    aiCategoryConfidence?: number | null;
    finalCategory: IssueCategory;
    categorySource: 'ai_confirmed' | 'ai_overridden' | 'manual_fallback';
    duplicateIssueId?: number | null;
    isOfflineCapture?: boolean;
    photoHash?: string;
  }): { complaint: Complaint; issue: Issue; duplicateCandidate: DuplicateCandidate | null } {
    const reporter = this.users.find((u) => u.id === params.reporterUserId);
    const complaintId = this.nextComplaintId++;
    const refNumber = String(complaintId).padStart(6, '0');
    const referenceId = `CVC-2026-${refNumber}`;

    const lat = params.deviceGpsLat ?? params.photoExifLat ?? 13.0012;
    const lng = params.deviceGpsLng ?? params.photoExifLng ?? 80.2580;

    let targetIssue: Issue;
    let duplicateCandidate: DuplicateCandidate | null = null;

    if (params.duplicateIssueId) {
      // Explicitly merging with an existing issue
      const existing = this.issues.find((i) => i.id === params.duplicateIssueId);
      if (!existing) throw new Error('Target issue for duplicate merge not found');
      targetIssue = existing;
      targetIssue.complaintCount += 1;

      // Check independent reporter
      const existingReporterComplaint = this.complaints.find(
        (c) => c.issueId === targetIssue.id && c.reporterUserId === params.reporterUserId
      );
      const isIndependent = !existingReporterComplaint;
      if (isIndependent) {
        targetIssue.independentReportersCount += 1;
      }

      // Recompute Evidence Confidence & Priority Score
      const evConf = this.calculateEvidenceConfidence(
        true,
        params.deviceGpsLat !== null,
        params.photoExifLat !== null,
        targetIssue.independentReportersCount
      );
      targetIssue.evidenceConfidenceScore = evConf.score;
      targetIssue.evidenceConfidenceBand = evConf.band;

      const priority = this.calculatePriorityScore(
        targetIssue.category,
        evConf.score,
        targetIssue.independentReportersCount,
        1,
        targetIssue.status === 'reopened'
      );
      targetIssue.priorityScore = priority.score;
      targetIssue.priorityBreakdown = priority.breakdown;
      targetIssue.updatedAt = new Date().toISOString();
    } else {
      // Check for duplicate candidate (75m radius)
      duplicateCandidate = this.findDuplicateCandidate(lat, lng, params.finalCategory);

      // Create new Issue initially
      const { zone, department } = this.lookupJurisdiction(lat, lng, params.finalCategory);

      const evConf = this.calculateEvidenceConfidence(
        true,
        params.deviceGpsLat !== null,
        params.photoExifLat !== null,
        1
      );

      const priority = this.calculatePriorityScore(
        params.finalCategory,
        evConf.score,
        1,
        0,
        false
      );

      const issueId = this.nextIssueId++;
      targetIssue = {
        id: issueId,
        category: params.finalCategory,
        status: 'submitted',
        jurisdictionZoneId: zone?.id || null,
        jurisdictionZoneName: zone?.zoneName || 'Unassigned Jurisdiction (Needs Manual Routing)',
        wardLabel: zone?.wardLabel || 'Outside Demo Wards',
        departmentId: department?.id || null,
        departmentName: department?.name || 'Unassigned Department',
        representativeLat: lat,
        representativeLng: lng,
        evidenceConfidenceBand: evConf.band,
        evidenceConfidenceScore: evConf.score,
        priorityScore: priority.score,
        priorityBreakdown: priority.breakdown,
        needsManualRouting: !zone,
        complaintCount: 1,
        independentReportersCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.issues.unshift(targetIssue);

      // Add status history entry
      this.statusHistory.push({
        id: this.nextHistoryId++,
        issueId: targetIssue.id,
        fromStatus: null,
        toStatus: 'submitted',
        changedByUserId: params.reporterUserId,
        changedByName: reporter?.displayName || 'Citizen',
        note: 'Issue created from citizen complaint',
        createdAt: new Date().toISOString(),
      });
    }

    // Spam Check Heuristics
    let suspiciousFlag = false;
    let suspiciousFlagReason: string | null = null;
    const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
    const recentSubmissions = this.complaints.filter(
      (c) => c.reporterUserId === params.reporterUserId && c.createdAt >= tenMinsAgo
    ).length;

    if (recentSubmissions >= 5) {
      suspiciousFlag = true;
      suspiciousFlagReason = 'High velocity submission (>= 5 in 10 minutes)';
    } else if (params.photoHash) {
      const sameHashCount = this.complaints.filter((c) => c.photoHash === params.photoHash).length;
      if (sameHashCount >= 3) {
        suspiciousFlag = true;
        suspiciousFlagReason = 'Duplicate photo hash detected (>= 3 occurrences)';
      }
    }

    const complaint: Complaint = {
      id: complaintId,
      referenceId,
      issueId: targetIssue.id,
      reporterUserId: params.reporterUserId,
      reporterName: reporter?.displayName || 'Citizen',
      descriptionText: params.descriptionText,
      descriptionSource: params.descriptionSource,
      voiceLanguageCode: params.voiceLanguageCode || null,
      photoUrl: params.photoUrl,
      photoExifLat: params.photoExifLat || null,
      photoExifLng: params.photoExifLng || null,
      exifGpsMatch: params.photoExifLat ? 1 : null,
      deviceGpsLat: params.deviceGpsLat,
      deviceGpsLng: params.deviceGpsLng,
      gpsIsApproximate: params.gpsIsApproximate || false,
      capturedAt: params.capturedAt,
      submittedAt: new Date().toISOString(),
      aiSuggestedCategory: params.aiSuggestedCategory || null,
      aiCategoryConfidence: params.aiCategoryConfidence || null,
      finalCategory: params.finalCategory,
      categorySource: params.categorySource,
      syncStatus: 'submitted',
      duplicateLinkDecision: params.duplicateIssueId
        ? 'linked_as_duplicate'
        : duplicateCandidate
        ? null
        : 'new_issue',
      isIndependentCorroboration: true,
      suspiciousFlag,
      suspiciousFlagReason,
      photoHash: params.photoHash,
      createdAt: new Date().toISOString(),
    };

    this.complaints.unshift(complaint);

    // Trigger stage notification & mock SMS
    this.sendStageNotification(complaint.id, 'submitted');

    return { complaint, issue: targetIssue, duplicateCandidate };
  }

  // Handle duplicate decision
  resolveDuplicateDecision(complaintId: number, decision: 'same_issue' | 'different_issue', targetCandidateIssueId?: number) {
    const complaint = this.complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    if (decision === 'same_issue' && targetCandidateIssueId) {
      const oldIssue = this.issues.find((i) => i.id === complaint.issueId);
      const targetIssue = this.issues.find((i) => i.id === targetCandidateIssueId);
      if (!targetIssue) throw new Error('Target candidate issue not found');

      // Reassign complaint
      complaint.issueId = targetIssue.id;
      complaint.duplicateLinkDecision = 'linked_as_duplicate';

      // Check if independent
      const prior = this.complaints.filter(
        (c) => c.issueId === targetIssue.id && c.reporterUserId === complaint.reporterUserId && c.id !== complaint.id
      );
      complaint.isIndependentCorroboration = prior.length === 0;

      targetIssue.complaintCount += 1;
      if (complaint.isIndependentCorroboration) {
        targetIssue.independentReportersCount += 1;
      }

      // Recompute confidence and priority
      const evConf = this.calculateEvidenceConfidence(
        true,
        complaint.deviceGpsLat !== null,
        complaint.photoExifLat !== null,
        targetIssue.independentReportersCount
      );
      targetIssue.evidenceConfidenceScore = evConf.score;
      targetIssue.evidenceConfidenceBand = evConf.band;

      const priority = this.calculatePriorityScore(
        targetIssue.category,
        evConf.score,
        targetIssue.independentReportersCount,
        1,
        targetIssue.status === 'reopened'
      );
      targetIssue.priorityScore = priority.score;
      targetIssue.priorityBreakdown = priority.breakdown;
      targetIssue.updatedAt = new Date().toISOString();

      // Clean up orphaned old issue if it only had this complaint
      if (oldIssue && oldIssue.id !== targetIssue.id) {
        const otherComplaints = this.complaints.filter((c) => c.issueId === oldIssue.id && c.id !== complaint.id);
        if (otherComplaints.length === 0) {
          this.issues = this.issues.filter((i) => i.id !== oldIssue.id);
        }
      }

      return { complaint, issue: targetIssue };
    } else {
      complaint.duplicateLinkDecision = 'new_issue';
      const issue = this.issues.find((i) => i.id === complaint.issueId);
      return { complaint, issue: issue! };
    }
  }

  // Update Status and notify
  updateIssueStatus(
    issueId: number,
    toStatus: IssueStatus,
    changedByUserId: number,
    note?: string
  ): Issue {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');

    const user = this.users.find((u) => u.id === changedByUserId);
    const fromStatus = issue.status;

    // Validate Transition Matrix
    const validTransitions: Record<string, IssueStatus[]> = {
      'submitted': ['acknowledged', 'closed'],
      'acknowledged': ['ongoing', 'closed'],
      'ongoing': ['resolved', 'needs_verification'],
      'needs_verification': ['resolved'],
      'resolved': ['closed', 'reopened'],
      'reopened': ['acknowledged', 'ongoing', 'resolved'],
      'closed': [],
    };

    if (fromStatus !== toStatus) {
      const allowed = validTransitions[fromStatus] || [];
      if (!allowed.includes(toStatus)) {
        throw new Error(`Invalid state transition from ${fromStatus} to ${toStatus}`);
      }
    }

    issue.status = toStatus;
    issue.updatedAt = new Date().toISOString();

    if (toStatus === 'resolved') {
      issue.resolvedAt = new Date().toISOString();
    } else if (toStatus === 'closed') {
      issue.closedAt = new Date().toISOString();
    } else if (toStatus === 'reopened') {
      issue.resolvedAt = null;
      issue.closedAt = null;
      // Recompute priority on reopen
      const priority = this.calculatePriorityScore(
        issue.category,
        issue.evidenceConfidenceScore,
        issue.independentReportersCount,
        24,
        true
      );
      issue.priorityScore = priority.score;
      issue.priorityBreakdown = priority.breakdown;
    }

    // Add status history
    this.statusHistory.push({
      id: this.nextHistoryId++,
      issueId,
      fromStatus,
      toStatus,
      changedByUserId,
      changedByName: user?.displayName || 'System',
      note: note || `Status changed to ${toStatus}`,
      createdAt: new Date().toISOString(),
    });

    // Notify all linked complaints & citizens
    const linkedComplaints = this.complaints.filter((c) => c.issueId === issueId);
    for (const c of linkedComplaints) {
      this.sendStageNotification(c.id, toStatus, note);
    }

    return issue;
  }

  // Officer Resolution with 100m tolerance cross-check (07_MAP_GIS_SPEC.md §9)
  submitResolutionEvidence(params: {
    issueId: number;
    officerUserId: number;
    photoUrl: string;
    officerGpsLat: number | null;
    officerGpsLng: number | null;
    capturedAt: string;
  }): {
    issue: Issue;
    resolutionEvidence: ResolutionEvidence;
    verificationResult: 'matched' | 'needs_verification';
    reason: string;
  } {
    const issue = this.issues.find((i) => i.id === params.issueId);
    if (!issue) throw new Error('Issue not found');

    const officer = this.users.find((u) => u.id === params.officerUserId);
    const RESOLUTION_TOLERANCE_METERS = 100;

    let verificationResult: 'matched' | 'needs_verification' = 'matched';
    let distanceM: number | null = null;
    let reason = 'Within 100m geospatial tolerance of original complaint.';

    if (params.officerGpsLat === null || params.officerGpsLng === null) {
      verificationResult = 'needs_verification';
      reason = 'Resolution photo submitted without GPS coordinate fix.';
    } else {
      distanceM = this.getDistanceMeters(
        params.officerGpsLat,
        params.officerGpsLng,
        issue.representativeLat,
        issue.representativeLng
      );

      if (distanceM > RESOLUTION_TOLERANCE_METERS) {
        verificationResult = 'needs_verification';
        reason = `Officer GPS is ${distanceM}m away from original report (exceeds ${RESOLUTION_TOLERANCE_METERS}m tolerance).`;
      }
    }

    const resEvidence: ResolutionEvidence = {
      id: this.nextResolutionId++,
      issueId: issue.id,
      officerUserId: params.officerUserId,
      officerName: officer?.displayName || 'Officer',
      photoUrl: params.photoUrl,
      officerGpsLat: params.officerGpsLat,
      officerGpsLng: params.officerGpsLng,
      capturedAt: params.capturedAt,
      distanceFromOriginalM: distanceM,
      verificationResult,
      verificationReason: reason,
      createdAt: new Date().toISOString(),
    };

    this.resolutionEvidence.push(resEvidence);
    issue.resolutionEvidence = resEvidence;

    const nextStatus: IssueStatus = verificationResult === 'matched' ? 'resolved' : 'needs_verification';
    this.updateIssueStatus(issue.id, nextStatus, params.officerUserId, reason);

    return {
      issue,
      resolutionEvidence: resEvidence,
      verificationResult,
      reason,
    };
  }

  // Calculate Recurring Hotspots (07_MAP_GIS_SPEC.md §6, F-18)
  getHotspots(): HotspotItem[] {
    const GRID_SIZE = 0.005; // ~500m
    const cellMap = new Map<string, { lat: number; lng: number; issues: Issue[] }>();

    for (const issue of this.issues) {
      const cellLat = Math.floor(issue.representativeLat / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
      const cellLng = Math.floor(issue.representativeLng / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
      const cellId = `${cellLat.toFixed(3)}_${cellLng.toFixed(3)}`;

      if (!cellMap.has(cellId)) {
        cellMap.set(cellId, { lat: cellLat, lng: cellLng, issues: [] });
      }
      cellMap.get(cellId)!.issues.push(issue);
    }

    const hotspots: HotspotItem[] = [];
    for (const [cellId, cellData] of cellMap.entries()) {
      const issueCount = cellData.issues.length;
      // Dominant category
      const categoryCounts: Record<string, number> = {};
      for (const i of cellData.issues) {
        categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
      }
      let dominantCategory: IssueCategory = 'pothole';
      let maxCount = 0;
      for (const [cat, cnt] of Object.entries(categoryCounts)) {
        if (cnt > maxCount) {
          maxCount = cnt;
          dominantCategory = cat as IssueCategory;
        }
      }

      const riskLevel = issueCount >= 3 ? 'high' : issueCount >= 2 ? 'medium' : 'low';
      hotspots.push({
        gridCellId: cellId,
        lat: cellData.lat,
        lng: cellData.lng,
        issueCount,
        dominantCategory,
        riskLevel,
      });
    }

    return hotspots;
  }
}

export const db = new CitizenDatabase();
