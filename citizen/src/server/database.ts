import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
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


class CitizenDatabase {
  db: Database.Database;

  private nextIssueId = 100;
  private nextComplaintId = 500;
  private nextResolutionId = 200;
  private nextHistoryId = 1000;
  private nextNotificationId = 3000;
  private nextSmsId = 8000;

  constructor() {
    this.db = new Database('citizen.db');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
    const count = this.db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
    if (count.c === 0) {
      this.resetToSeedData();
    }
    this.nextIssueId = ((this.db.prepare('SELECT MAX(id) as m FROM issues').get() as any).m || 100) + 1;
    this.nextComplaintId = ((this.db.prepare('SELECT MAX(id) as m FROM complaints').get() as any).m || 500) + 1;
    this.nextResolutionId = ((this.db.prepare('SELECT MAX(id) as m FROM resolution_evidence').get() as any).m || 200) + 1;
    this.nextHistoryId = ((this.db.prepare('SELECT MAX(id) as m FROM status_history').get() as any).m || 1000) + 1;
    this.nextNotificationId = ((this.db.prepare('SELECT MAX(id) as m FROM notifications').get() as any).m || 3000) + 1;
    this.nextSmsId = ((this.db.prepare('SELECT MAX(id) as m FROM sms_outbox').get() as any).m || 8000) + 1;
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        role TEXT,
        displayName TEXT,
        phoneNumber TEXT,
        passwordHash TEXT,
        departmentId INTEGER,
        jurisdictionZoneId INTEGER,
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY,
        name TEXT,
        categoryTypes TEXT,
        isDemoData INTEGER
      );
      CREATE TABLE IF NOT EXISTS jurisdiction_zones (
        id INTEGER PRIMARY KEY,
        zoneName TEXT,
        localBodyType TEXT,
        wardLabel TEXT,
        departmentId INTEGER,
        boundaryGeojson TEXT,
        isDemoData INTEGER
      );
      CREATE TABLE IF NOT EXISTS issues (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        status TEXT,
        jurisdictionZoneId INTEGER,
        jurisdictionZoneName TEXT,
        wardLabel TEXT,
        departmentId INTEGER,
        departmentName TEXT,
        representativeLat REAL,
        representativeLng REAL,
        evidenceConfidenceBand TEXT,
        evidenceConfidenceScore REAL,
        priorityScore REAL,
        priorityBreakdown TEXT,
        needsManualRouting INTEGER,
        complaintCount INTEGER,
        independentReportersCount INTEGER,
        createdAt TEXT,
        updatedAt TEXT,
        resolvedAt TEXT,
        closedAt TEXT
      );
      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referenceId TEXT,
        issueId INTEGER,
        reporterUserId INTEGER,
        reporterName TEXT,
        descriptionText TEXT,
        descriptionSource TEXT,
        voiceLanguageCode TEXT,
        photoUrl TEXT,
        photoExifLat REAL,
        photoExifLng REAL,
        exifGpsMatch INTEGER,
        deviceGpsLat REAL,
        deviceGpsLng REAL,
        gpsIsApproximate INTEGER,
        capturedAt TEXT,
        submittedAt TEXT,
        aiSuggestedCategory TEXT,
        aiCategoryConfidence REAL,
        finalCategory TEXT,
        categorySource TEXT,
        syncStatus TEXT,
        duplicateLinkDecision TEXT,
        isIndependentCorroboration INTEGER,
        suspiciousFlag INTEGER,
        suspiciousFlagReason TEXT,
        photoHash TEXT,
        createdAt TEXT,
        FOREIGN KEY(issueId) REFERENCES issues(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS resolution_evidence (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueId INTEGER,
        officerUserId INTEGER,
        officerName TEXT,
        photoUrl TEXT,
        officerGpsLat REAL,
        officerGpsLng REAL,
        capturedAt TEXT,
        distanceFromOriginalM REAL,
        verificationResult TEXT,
        verificationReason TEXT,
        createdAt TEXT,
        FOREIGN KEY(issueId) REFERENCES issues(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueId INTEGER,
        fromStatus TEXT,
        toStatus TEXT,
        changedByUserId INTEGER,
        changedByName TEXT,
        note TEXT,
        createdAt TEXT,
        FOREIGN KEY(issueId) REFERENCES issues(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaintId INTEGER,
        stage TEXT,
        createdAt TEXT,
        FOREIGN KEY(complaintId) REFERENCES complaints(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS sms_outbox (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notificationId INTEGER,
        complaintReferenceId TEXT,
        toPhoneNumber TEXT,
        messageBody TEXT,
        sendStatus TEXT,
        createdAt TEXT,
        FOREIGN KEY(notificationId) REFERENCES notifications(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS issue_evidence_signals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        issueId INTEGER,
        signalType TEXT,
        confidenceScore REAL,
        createdAt TEXT,
        FOREIGN KEY(issueId) REFERENCES issues(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS hotspots (
        gridCellId TEXT PRIMARY KEY,
        lat REAL,
        lng REAL,
        issueCount INTEGER,
        dominantCategory TEXT,
        riskLevel TEXT
      );
    `);
  }

  get users(): User[] {
    // Never expose password hashes to frontend
    return (this.db.prepare('SELECT * FROM users').all() as any[]).map(({ passwordHash, ...u }) => u as User);
  }

  getUserById(id: number): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!row) return null;
    const { passwordHash, ...user } = row;
    return user as User;
  }

  verifyCredentials(userId: number, password: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!row || !row.passwordHash) return null;
    const valid = bcrypt.compareSync(password, row.passwordHash);
    if (!valid) return null;
    const { passwordHash, ...user } = row;
    return user as User;
  }

  get departments(): Department[] {
    return this.db.prepare('SELECT * FROM departments').all().map((r: any) => ({
      ...r,
      categoryTypes: JSON.parse(r.categoryTypes)
    }));
  }

  get jurisdictionZones(): JurisdictionZone[] {
    return this.db.prepare('SELECT * FROM jurisdiction_zones').all().map((r: any) => ({
      ...r,
      boundaryGeojson: JSON.parse(r.boundaryGeojson)
    }));
  }

  get issues(): Issue[] {
    return this.db.prepare('SELECT * FROM issues ORDER BY id DESC').all().map((r: any) => {
      const res = this.db.prepare('SELECT * FROM resolution_evidence WHERE issueId = ?').get(r.id) as ResolutionEvidence;
      return {
        ...r,
        needsManualRouting: Boolean(r.needsManualRouting),
        priorityBreakdown: JSON.parse(r.priorityBreakdown),
        resolutionEvidence: res || null
      };
    });
  }

  get complaints(): Complaint[] {
    return this.db.prepare('SELECT * FROM complaints ORDER BY id DESC').all().map((r: any) => ({
      ...r,
      gpsIsApproximate: Boolean(r.gpsIsApproximate),
      isIndependentCorroboration: Boolean(r.isIndependentCorroboration),
      suspiciousFlag: Boolean(r.suspiciousFlag)
    }));
  }

  get resolutionEvidence(): ResolutionEvidence[] {
    return this.db.prepare('SELECT * FROM resolution_evidence').all() as ResolutionEvidence[];
  }

  get statusHistory(): StatusHistoryItem[] {
    return this.db.prepare('SELECT * FROM status_history').all() as StatusHistoryItem[];
  }

  get notifications(): NotificationItem[] {
    return this.db.prepare('SELECT * FROM notifications').all() as NotificationItem[];
  }

  get smsOutbox(): SmsOutboxItem[] {
    return this.db.prepare('SELECT * FROM sms_outbox').all() as SmsOutboxItem[];
  }

  resetToSeedData() {
    this.db.exec(`
      DELETE FROM users;
      DELETE FROM departments;
      DELETE FROM jurisdiction_zones;
      DELETE FROM issues;
      DELETE FROM complaints;
      DELETE FROM resolution_evidence;
      DELETE FROM status_history;
      DELETE FROM notifications;
      DELETE FROM sms_outbox;
      DELETE FROM issue_evidence_signals;
      DELETE FROM hotspots;
    `);

    // Passwords: priya123, karthik123, officer123, admin123
    const passwords: Record<number, string> = {
      1: bcrypt.hashSync('priya123', 10),
      2: bcrypt.hashSync('karthik123', 10),
      3: bcrypt.hashSync('officer123', 10),
      4: bcrypt.hashSync('admin123', 10),
    };
    const insertUser = this.db.prepare('INSERT INTO users (id, role, displayName, phoneNumber, passwordHash, departmentId, jurisdictionZoneId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    for (const u of initialUsers) {
      insertUser.run(u.id, u.role, u.displayName, u.phoneNumber, passwords[u.id] || null, u.departmentId || null, u.jurisdictionZoneId || null, u.createdAt);
    }

    const insertDept = this.db.prepare('INSERT INTO departments (id, name, categoryTypes, isDemoData) VALUES (?, ?, ?, ?)');
    for (const d of initialDepartments) {
      insertDept.run(d.id, d.name, JSON.stringify(d.categoryTypes), d.isDemoData);
    }

    const insertZone = this.db.prepare('INSERT INTO jurisdiction_zones (id, zoneName, localBodyType, wardLabel, departmentId, boundaryGeojson, isDemoData) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const z of initialJurisdictionZones) {
      insertZone.run(z.id, z.zoneName, z.localBodyType, z.wardLabel, z.departmentId, JSON.stringify(z.boundaryGeojson), z.isDemoData);
    }

    const i1 = {
      id: 101, category: 'footpath', status: 'ongoing', jurisdictionZoneId: 1, jurisdictionZoneName: 'Zone 13 - Adyar (Demo)',
      wardLabel: 'Ward 175 (Adyar / Besant Nagar / Guindy)', departmentId: 1, departmentName: 'Roads & Infrastructure (Zone 13 Demo)',
      representativeLat: 13.0012, representativeLng: 80.2580, evidenceConfidenceBand: 'high', evidenceConfidenceScore: 0.85,
      priorityScore: 41.5, priorityBreakdown: { severity: 30, publicExposure: 40, vulnerablePopulation: 50, criticalInfrastructure: 20, duration: 60, communityCorroboration: 25, recurrence: 30, evidenceConfidence: 85 },
      needsManualRouting: 0, complaintCount: 1, independentReportersCount: 1, createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), resolvedAt: null, closedAt: null
    };
    const i2 = {
      id: 102, category: 'garbage', status: 'submitted', jurisdictionZoneId: 2, jurisdictionZoneName: 'Zone 9 - Mylapore (Demo)',
      wardLabel: 'Ward 123 (Mylapore / Santhome)', departmentId: 2, departmentName: 'Solid Waste Management (Zone 13 Demo)',
      representativeLat: 13.0335, representativeLng: 80.2680, evidenceConfidenceBand: 'high', evidenceConfidenceScore: 0.90,
      priorityScore: 68.0, priorityBreakdown: { severity: 70, publicExposure: 85, vulnerablePopulation: 60, criticalInfrastructure: 40, duration: 75, communityCorroboration: 80, recurrence: 90, evidenceConfidence: 90 },
      needsManualRouting: 0, complaintCount: 3, independentReportersCount: 3, createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(), updatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), resolvedAt: null, closedAt: null
    };
    const i3 = {
      id: 103, category: 'streetlight', status: 'resolved', jurisdictionZoneId: 3, jurisdictionZoneName: 'Zone 10 - T. Nagar (Demo)',
      wardLabel: 'Ward 134 (T. Nagar / Kodambakkam)', departmentId: 3, departmentName: 'Electrical & Streetlighting (Zone 13 Demo)',
      representativeLat: 13.0390, representativeLng: 80.2320, evidenceConfidenceBand: 'high', evidenceConfidenceScore: 0.95,
      priorityScore: 54.0, priorityBreakdown: { severity: 50, publicExposure: 70, vulnerablePopulation: 65, criticalInfrastructure: 40, duration: 30, communityCorroboration: 50, recurrence: 40, evidenceConfidence: 95 },
      needsManualRouting: 0, complaintCount: 1, independentReportersCount: 1, createdAt: new Date(Date.now() - 96 * 3600 * 1000).toISOString(), updatedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), resolvedAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), closedAt: null
    };

    const insertIssue = this.db.prepare('INSERT INTO issues (id, category, status, jurisdictionZoneId, jurisdictionZoneName, wardLabel, departmentId, departmentName, representativeLat, representativeLng, evidenceConfidenceBand, evidenceConfidenceScore, priorityScore, priorityBreakdown, needsManualRouting, complaintCount, independentReportersCount, createdAt, updatedAt, resolvedAt, closedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    [i1, i2, i3].forEach(i => {
      insertIssue.run(i.id, i.category, i.status, i.jurisdictionZoneId, i.jurisdictionZoneName, i.wardLabel, i.departmentId, i.departmentName, i.representativeLat, i.representativeLng, i.evidenceConfidenceBand, i.evidenceConfidenceScore, i.priorityScore, JSON.stringify(i.priorityBreakdown), i.needsManualRouting, i.complaintCount, i.independentReportersCount, i.createdAt, i.updatedAt, i.resolvedAt, i.closedAt);
    });

    const c1 = { id: 501, referenceId: 'CVC-2026-000101', issueId: 101, reporterUserId: 2, reporterName: 'Karthik Raja (Citizen B)', descriptionText: 'Cracked concrete slab on 4th Main Road footpath near park.', descriptionSource: 'typed', voiceLanguageCode: null, photoUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80', photoExifLat: 13.0012, photoExifLng: 80.2580, exifGpsMatch: 1, deviceGpsLat: 13.0012, deviceGpsLng: 80.2580, gpsIsApproximate: 0, capturedAt: i1.createdAt, submittedAt: i1.createdAt, aiSuggestedCategory: 'footpath', aiCategoryConfidence: 0.92, finalCategory: 'footpath', categorySource: 'ai_confirmed', syncStatus: 'submitted', duplicateLinkDecision: 'new_issue', isIndependentCorroboration: 1, suspiciousFlag: 0, suspiciousFlagReason: null, photoHash: null, createdAt: i1.createdAt };
    const c2 = { id: 502, referenceId: 'CVC-2026-000102', issueId: 102, reporterUserId: 1, reporterName: 'Priya Narayanan (Citizen A)', descriptionText: 'Overflowing commercial garbage bin near Luz Church Road market entrance.', descriptionSource: 'typed', voiceLanguageCode: null, photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80', photoExifLat: null, photoExifLng: null, exifGpsMatch: null, deviceGpsLat: 13.0335, deviceGpsLng: 80.2680, gpsIsApproximate: 0, capturedAt: i2.createdAt, submittedAt: i2.createdAt, aiSuggestedCategory: 'garbage', aiCategoryConfidence: 0.95, finalCategory: 'garbage', categorySource: 'ai_confirmed', syncStatus: 'submitted', duplicateLinkDecision: 'new_issue', isIndependentCorroboration: 1, suspiciousFlag: 0, suspiciousFlagReason: null, photoHash: null, createdAt: i2.createdAt };
    const c3 = { id: 503, referenceId: 'CVC-2026-000103', issueId: 103, reporterUserId: 2, reporterName: 'Karthik Raja (Citizen B)', descriptionText: 'Non-functioning LED street fixture at North Usman Road junction.', descriptionSource: 'typed', voiceLanguageCode: null, photoUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80', photoExifLat: null, photoExifLng: null, exifGpsMatch: null, deviceGpsLat: 13.0390, deviceGpsLng: 80.2320, gpsIsApproximate: 0, capturedAt: i3.createdAt, submittedAt: i3.createdAt, aiSuggestedCategory: null, aiCategoryConfidence: null, finalCategory: 'streetlight', categorySource: 'ai_confirmed', syncStatus: 'submitted', duplicateLinkDecision: null, isIndependentCorroboration: 1, suspiciousFlag: 0, suspiciousFlagReason: null, photoHash: null, createdAt: i3.createdAt };

    const insertComp = this.db.prepare('INSERT INTO complaints (id, referenceId, issueId, reporterUserId, reporterName, descriptionText, descriptionSource, voiceLanguageCode, photoUrl, photoExifLat, photoExifLng, exifGpsMatch, deviceGpsLat, deviceGpsLng, gpsIsApproximate, capturedAt, submittedAt, aiSuggestedCategory, aiCategoryConfidence, finalCategory, categorySource, syncStatus, duplicateLinkDecision, isIndependentCorroboration, suspiciousFlag, suspiciousFlagReason, photoHash, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    [c1, c2, c3].forEach(c => insertComp.run(c.id, c.referenceId, c.issueId, c.reporterUserId, c.reporterName, c.descriptionText, c.descriptionSource, c.voiceLanguageCode, c.photoUrl, c.photoExifLat, c.photoExifLng, c.exifGpsMatch, c.deviceGpsLat, c.deviceGpsLng, c.gpsIsApproximate, c.capturedAt, c.submittedAt, c.aiSuggestedCategory, c.aiCategoryConfidence, c.finalCategory, c.categorySource, c.syncStatus, c.duplicateLinkDecision, c.isIndependentCorroboration, c.suspiciousFlag, c.suspiciousFlagReason, c.photoHash, c.createdAt));

    const sh1 = { id: 1001, issueId: 101, fromStatus: null, toStatus: 'submitted', changedByUserId: 2, changedByName: 'Karthik Raja', note: 'Initial citizen complaint submitted', createdAt: i1.createdAt };
    const sh2 = { id: 1002, issueId: 101, fromStatus: 'submitted', toStatus: 'acknowledged', changedByUserId: 3, changedByName: 'Officer Ramesh Kumar', note: 'Assigned to Ward 175 maintenance crew', createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString() };
    const sh3 = { id: 1003, issueId: 101, fromStatus: 'acknowledged', toStatus: 'ongoing', changedByUserId: 3, changedByName: 'Officer Ramesh Kumar', note: 'Crew dispatched with replacement pavers', createdAt: i1.updatedAt };
    const sh4 = { id: 1004, issueId: 103, fromStatus: 'ongoing', toStatus: 'resolved', changedByUserId: 3, changedByName: 'Officer Ramesh Kumar', note: 'Driver replaced and LED bulb tested operational', createdAt: i3.resolvedAt };

    const insertSh = this.db.prepare('INSERT INTO status_history (id, issueId, fromStatus, toStatus, changedByUserId, changedByName, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    [sh1, sh2, sh3, sh4].forEach(s => insertSh.run(s.id, s.issueId, s.fromStatus, s.toStatus, s.changedByUserId, s.changedByName, s.note, s.createdAt));

    const so1 = { id: 8001, notificationId: 3001, complaintReferenceId: 'CVC-2026-000101', toPhoneNumber: '+91 98402 34567', messageBody: 'CITIZEN: Your complaint CVC-2026-000101 has been registered and routed to Roads & Infrastructure (Zone 13).', sendStatus: 'sent_mock', createdAt: i1.createdAt };
    const so2 = { id: 8002, notificationId: 3002, complaintReferenceId: 'CVC-2026-000101', toPhoneNumber: '+91 98402 34567', messageBody: 'CITIZEN: Officer Ramesh has acknowledged your report CVC-2026-000101. Work scheduled.', sendStatus: 'sent_mock', createdAt: sh2.createdAt };
    const so3 = { id: 8003, notificationId: 3003, complaintReferenceId: 'CVC-2026-000103', toPhoneNumber: '+91 98402 34567', messageBody: 'CITIZEN: Issue CVC-2026-000103 has been marked RESOLVED with geo-verified proof. Please confirm in app.', sendStatus: 'sent_mock', createdAt: i3.resolvedAt };

    const insertNotif = this.db.prepare('INSERT INTO notifications (id, complaintId, stage, createdAt) VALUES (?, ?, ?, ?)');
    const insertSms = this.db.prepare('INSERT INTO sms_outbox (id, notificationId, complaintReferenceId, toPhoneNumber, messageBody, sendStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
    [so1, so2, so3].forEach(s => {
      insertNotif.run(s.notificationId, 501, 'acknowledged', s.createdAt); // Simplified
      insertSms.run(s.id, s.notificationId, s.complaintReferenceId, s.toPhoneNumber, s.messageBody, s.sendStatus, s.createdAt);
    });
  }

  // --- GIS HELPER ALGORITHMS (07_MAP_GIS_SPEC.md) ---

  getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  isPointInPolygon(lat: number, lng: number, polygonCoords: number[][]): boolean {
    let inside = false;
    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
      const xi = polygonCoords[i][0];
      const yi = polygonCoords[i][1];
      const xj = polygonCoords[j][0];
      const yj = polygonCoords[j][1];
      const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  lookupJurisdiction(lat: number, lng: number, category: IssueCategory): { zone: JurisdictionZone | null; department: Department | null } {
    let matchedZone: JurisdictionZone | null = null;
    const zones = this.jurisdictionZones;
    for (const zone of zones) {
      if (this.isPointInPolygon(lat, lng, zone.boundaryGeojson.coordinates[0])) {
        matchedZone = zone;
        break;
      }
    }
    if (!matchedZone) return { zone: null, department: null };
    const depts = this.departments;
    const matchedDept = depts.find((dept) => dept.categoryTypes.includes(category)) || depts.find((dept) => dept.id === matchedZone!.departmentId) || depts[0];
    return { zone: matchedZone, department: matchedDept };
  }

  findDuplicateCandidate(lat: number, lng: number, category: IssueCategory, excludeIssueId?: number): DuplicateCandidate | null {
    const DUPLICATE_RADIUS_METERS = 75;
    let closestCandidate: DuplicateCandidate | null = null;
    let minDistance = Infinity;
    const issues = this.issues;
    const complaints = this.complaints;
    for (const issue of issues) {
      if (excludeIssueId && issue.id === excludeIssueId) continue;
      if (issue.status === 'closed') continue;
      if (issue.category === category) {
        const dist = this.getDistanceMeters(lat, lng, issue.representativeLat, issue.representativeLng);
        if (dist <= DUPLICATE_RADIUS_METERS && dist < minDistance) {
          minDistance = dist;
          const firstComplaint = complaints.find((c) => c.issueId === issue.id);
          closestCandidate = { issueId: issue.id, distanceM: dist, category: issue.category, existingComplaintCount: issue.complaintCount, representativeLat: issue.representativeLat, representativeLng: issue.representativeLng, photoUrl: firstComplaint?.photoUrl };
        }
      }
    }
    return closestCandidate;
  }

  calculateEvidenceConfidence(hasPhoto: boolean, hasValidGps: boolean, exifMatch: boolean | null, independentReportersCount: number): { score: number; band: EvidenceConfidenceBand } {
    let score = 0;
    if (hasPhoto) score += 0.35;
    if (hasValidGps) score += 0.25;
    if (exifMatch === true) score += 0.10;
    if (independentReportersCount >= 2) score += 0.20;
    if (independentReportersCount >= 3) score += 0.10;
    score = Math.min(1.0, Math.max(0.1, score));
    let band: EvidenceConfidenceBand = 'low';
    if (score >= 0.70) band = 'high';
    else if (score >= 0.40) band = 'needs_verification';
    return { score: Number(score.toFixed(2)), band };
  }

  calculatePriorityScore(category: IssueCategory, evidenceConfidenceScore: number, independentReportersCount: number, createdAt: string, isReopened: boolean): { score: number; breakdown: PriorityBreakdown } {
    const elapsedMs = Date.now() - new Date(createdAt).getTime();
    const durationHours = Math.max(0, elapsedMs / 3600000);
    
    // Dynamic Severity Scaling based on category + time + community reports
    let baseSeverity = 50;
    if (category === 'pothole') baseSeverity = 80;
    else if (category === 'drainage') baseSeverity = 75;
    else if (category === 'road_damage') baseSeverity = 70;
    else if (category === 'garbage') baseSeverity = 60;
    else if (category === 'streetlight') baseSeverity = 45;
    else if (category === 'footpath') baseSeverity = 35;
    
    // Escalate severity mathematically: longer it's ignored + more people report it = compounding severity
    let severity = baseSeverity + (independentReportersCount * 2.5) + (durationHours * 0.1);
    severity = Math.min(100, Math.max(10, severity));

    const publicExposure = category === 'pothole' || category === 'road_damage' ? 85 : 60;
    const vulnerablePopulation = category === 'pothole' || category === 'drainage' || category === 'footpath' ? 80 : 50;
    const criticalInfrastructure = category === 'pothole' || category === 'water_supply' ? 75 : 40;
    
    let duration = Math.min(100, Math.round(durationHours * 1.5 + (isReopened ? 35 : 0)));
    duration = Math.max(20, duration);
    
    const communityCorroboration = Math.min(100, independentReportersCount * 45);
    const recurrence = category === 'pothole' || category === 'drainage' ? 70 : 40;
    const evidenceConfidence = Math.round(evidenceConfidenceScore * 100);
    
    // Weighted final matrix
    const weightedScore = severity * 0.25 + publicExposure * 0.15 + vulnerablePopulation * 0.10 + criticalInfrastructure * 0.10 + duration * 0.10 + communityCorroboration * 0.15 + recurrence * 0.05 + evidenceConfidence * 0.10;
    const finalScore = Number(Math.min(100, Math.max(10, weightedScore)).toFixed(1));
    
    return { 
      score: finalScore, 
      breakdown: { severity, publicExposure, vulnerablePopulation, criticalInfrastructure, duration, communityCorroboration, recurrence, evidenceConfidence } 
    };
  }

  sendStageNotification(complaintId: number, stage: IssueStatus, customNote?: string) {
    const complaint = this.db.prepare('SELECT * FROM complaints WHERE id = ?').get(complaintId) as Complaint;
    if (!complaint) return;
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(complaint.reporterUserId) as User;
    const toPhone = user?.phoneNumber || '+91 98400 00000';
    const notifId = this.nextNotificationId++;
    this.db.prepare('INSERT INTO notifications (id, complaintId, stage, createdAt) VALUES (?, ?, ?, ?)').run(notifId, complaintId, stage, new Date().toISOString());
    let message = `CITIZEN [${complaint.referenceId}]: Status updated to ${stage.toUpperCase()}.`;
    if (stage === 'submitted') message = `CITIZEN: Your report ${complaint.referenceId} (${complaint.finalCategory}) has been successfully submitted and geo-routed.`;
    else if (stage === 'acknowledged') message = `CITIZEN: Officer Ramesh has acknowledged your report ${complaint.referenceId}. Department review complete.`;
    else if (stage === 'ongoing') message = `CITIZEN: Work is ONGOING for ${complaint.referenceId}. Maintenance crew is on-site.`;
    else if (stage === 'resolved') message = `CITIZEN: Issue ${complaint.referenceId} has been marked RESOLVED with geo-verified proof. Please confirm resolution in app.`;
    else if (stage === 'reopened') message = `CITIZEN: Issue ${complaint.referenceId} has been REOPENED upon citizen request: ${customNote || 'Needs further work'}.`;
    else if (stage === 'closed') message = `CITIZEN: Thank you! Resolution for ${complaint.referenceId} has been confirmed by citizen. Ticket closed.`;
    else if (stage === 'needs_verification') message = `CITIZEN: Resolution proof for ${complaint.referenceId} has been submitted and queued for verification.`;
    const smsId = this.nextSmsId++;
    this.db.prepare('INSERT INTO sms_outbox (id, notificationId, complaintReferenceId, toPhoneNumber, messageBody, sendStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)').run(smsId, notifId, complaint.referenceId, toPhone, message, 'sent_mock', new Date().toISOString());
  }

  createComplaint(params: { reporterUserId: number; descriptionText: string; descriptionSource: 'typed' | 'voice_transcript'; voiceLanguageCode?: string | null; photoUrl: string; photoExifLat?: number | null; photoExifLng?: number | null; deviceGpsLat: number | null; deviceGpsLng: number | null; gpsIsApproximate?: boolean; capturedAt: string; aiSuggestedCategory?: IssueCategory | null; aiCategoryConfidence?: number | null; finalCategory: IssueCategory; categorySource: 'ai_confirmed' | 'ai_overridden' | 'manual_fallback'; duplicateIssueId?: number | null; isOfflineCapture?: boolean; photoHash?: string; }): { complaint: Complaint; issue: Issue; duplicateCandidate: DuplicateCandidate | null } {
    const reporter = this.db.prepare('SELECT * FROM users WHERE id = ?').get(params.reporterUserId) as User;
    const complaintId = this.nextComplaintId++;
    const refNumber = String(complaintId).padStart(6, '0');
    const referenceId = `CVC-2026-${refNumber}`;
    const lat = params.deviceGpsLat ?? params.photoExifLat ?? 13.0012;
    const lng = params.deviceGpsLng ?? params.photoExifLng ?? 80.2580;
    let targetIssueId: number;
    let duplicateCandidate: DuplicateCandidate | null = null;
    if (params.duplicateIssueId) {
      const existing = this.issues.find((i) => i.id === params.duplicateIssueId);
      if (!existing) throw new Error('Target issue for duplicate merge not found');
      targetIssueId = existing.id;
      const existingReporterComplaint = this.complaints.find((c) => c.issueId === targetIssueId && c.reporterUserId === params.reporterUserId);
      const isIndependent = !existingReporterComplaint;
      const newInd = existing.independentReportersCount + (isIndependent ? 1 : 0);
      const evConf = this.calculateEvidenceConfidence(true, params.deviceGpsLat !== null, params.photoExifLat !== null, newInd);
      const priority = this.calculatePriorityScore(existing.category, evConf.score, newInd, existing.createdAt, existing.status === 'reopened');
      this.db.prepare('UPDATE issues SET complaintCount = complaintCount + 1, independentReportersCount = ?, evidenceConfidenceScore = ?, evidenceConfidenceBand = ?, priorityScore = ?, priorityBreakdown = ?, updatedAt = ? WHERE id = ?').run(newInd, evConf.score, evConf.band, priority.score, JSON.stringify(priority.breakdown), new Date().toISOString(), targetIssueId);
    } else {
      duplicateCandidate = this.findDuplicateCandidate(lat, lng, params.finalCategory);
      const { zone, department } = this.lookupJurisdiction(lat, lng, params.finalCategory);
      const evConf = this.calculateEvidenceConfidence(true, params.deviceGpsLat !== null, params.photoExifLat !== null, 1);
      const priority = this.calculatePriorityScore(params.finalCategory, evConf.score, 1, new Date().toISOString(), false);
      targetIssueId = this.nextIssueId++;
      this.db.prepare('INSERT INTO issues (id, category, status, jurisdictionZoneId, jurisdictionZoneName, wardLabel, departmentId, departmentName, representativeLat, representativeLng, evidenceConfidenceBand, evidenceConfidenceScore, priorityScore, priorityBreakdown, needsManualRouting, complaintCount, independentReportersCount, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(targetIssueId, params.finalCategory, 'submitted', zone?.id || null, zone?.zoneName || 'Unassigned Jurisdiction (Needs Manual Routing)', zone?.wardLabel || 'Outside Demo Wards', department?.id || null, department?.name || 'Unassigned Department', lat, lng, evConf.band, evConf.score, priority.score, JSON.stringify(priority.breakdown), !zone ? 1 : 0, 1, 1, new Date().toISOString(), new Date().toISOString());
      this.db.prepare('INSERT INTO status_history (id, issueId, fromStatus, toStatus, changedByUserId, changedByName, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(this.nextHistoryId++, targetIssueId, null, 'submitted', params.reporterUserId, reporter?.displayName || 'Citizen', 'Issue created from citizen complaint', new Date().toISOString());
    }
    let suspiciousFlag = 0; let suspiciousFlagReason: string | null = null;
    const tenMinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
    const recentSubmissions = this.complaints.filter(c => c.reporterUserId === params.reporterUserId && c.createdAt >= tenMinsAgo).length;
    if (recentSubmissions >= 5) { suspiciousFlag = 1; suspiciousFlagReason = 'High velocity submission (>= 5 in 10 minutes)'; } else if (params.photoHash) {
      const sameHashCount = this.complaints.filter((c) => c.photoHash === params.photoHash).length;
      if (sameHashCount >= 3) { suspiciousFlag = 1; suspiciousFlagReason = 'Duplicate photo hash detected (>= 3 occurrences)'; }
    }
    this.db.prepare('INSERT INTO complaints (id, referenceId, issueId, reporterUserId, reporterName, descriptionText, descriptionSource, voiceLanguageCode, photoUrl, photoExifLat, photoExifLng, exifGpsMatch, deviceGpsLat, deviceGpsLng, gpsIsApproximate, capturedAt, submittedAt, aiSuggestedCategory, aiCategoryConfidence, finalCategory, categorySource, syncStatus, duplicateLinkDecision, isIndependentCorroboration, suspiciousFlag, suspiciousFlagReason, photoHash, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(complaintId, referenceId, targetIssueId, params.reporterUserId, reporter?.displayName || 'Citizen', params.descriptionText, params.descriptionSource, params.voiceLanguageCode || null, params.photoUrl, params.photoExifLat || null, params.photoExifLng || null, params.photoExifLat ? 1 : null, params.deviceGpsLat, params.deviceGpsLng, params.gpsIsApproximate ? 1 : 0, params.capturedAt, new Date().toISOString(), params.aiSuggestedCategory || null, params.aiCategoryConfidence || null, params.finalCategory, params.categorySource, 'submitted', params.duplicateIssueId ? 'linked_as_duplicate' : duplicateCandidate ? null : 'new_issue', 1, suspiciousFlag, suspiciousFlagReason, params.photoHash || null, new Date().toISOString());
    this.sendStageNotification(complaintId, 'submitted');
    return { complaint: this.complaints.find(c => c.id === complaintId)!, issue: this.issues.find(i => i.id === targetIssueId)!, duplicateCandidate };
  }

  resolveDuplicateDecision(complaintId: number, decision: 'same_issue' | 'different_issue', targetCandidateIssueId?: number) {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');
    if (decision === 'same_issue' && targetCandidateIssueId) {
      const oldIssueId = complaint.issueId;
      const targetIssue = this.issues.find(i => i.id === targetCandidateIssueId);
      if (!targetIssue) throw new Error('Target candidate issue not found');
      this.db.prepare('UPDATE complaints SET issueId = ?, duplicateLinkDecision = ? WHERE id = ?').run(targetCandidateIssueId, 'linked_as_duplicate', complaint.id);
      const prior = this.complaints.filter(c => c.issueId === targetIssue.id && c.reporterUserId === complaint.reporterUserId && c.id !== complaint.id);
      const isInd = prior.length === 0;
      this.db.prepare('UPDATE complaints SET isIndependentCorroboration = ? WHERE id = ?').run(isInd ? 1 : 0, complaint.id);
      const newCompCount = targetIssue.complaintCount + 1;
      const newIndCount = targetIssue.independentReportersCount + (isInd ? 1 : 0);
      const evConf = this.calculateEvidenceConfidence(true, complaint.deviceGpsLat !== null, complaint.photoExifLat !== null, newIndCount);
      const priority = this.calculatePriorityScore(targetIssue.category, evConf.score, newIndCount, targetIssue.createdAt, targetIssue.status === 'reopened');
      this.db.prepare('UPDATE issues SET complaintCount = ?, independentReportersCount = ?, evidenceConfidenceScore = ?, evidenceConfidenceBand = ?, priorityScore = ?, priorityBreakdown = ?, updatedAt = ? WHERE id = ?').run(newCompCount, newIndCount, evConf.score, evConf.band, priority.score, JSON.stringify(priority.breakdown), new Date().toISOString(), targetIssue.id);
      if (oldIssueId !== targetIssue.id) {
        this.db.prepare('DELETE FROM issues WHERE id = ? AND NOT EXISTS (SELECT 1 FROM complaints WHERE issueId = ?)').run(oldIssueId, oldIssueId);
      }
      return { complaint: this.complaints.find(c => c.id === complaintId)!, issue: this.issues.find(i => i.id === targetIssue.id)! };
    } else {
      this.db.prepare('UPDATE complaints SET duplicateLinkDecision = ? WHERE id = ?').run('new_issue', complaint.id);
      return { complaint: this.complaints.find(c => c.id === complaintId)!, issue: this.issues.find(i => i.id === complaint.issueId)! };
    }
  }

  updateIssueStatus(issueId: number, toStatus: IssueStatus, changedByUserId: number, note?: string): Issue {
    const issue = this.issues.find((i) => i.id === issueId);
    if (!issue) throw new Error('Issue not found');
    const user = this.users.find((u) => u.id === changedByUserId);
    const fromStatus = issue.status;
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
      if (!allowed.includes(toStatus)) throw new Error(`Invalid state transition from ${fromStatus} to ${toStatus}`);
    }
    let resolvedAt = issue.resolvedAt; let closedAt = issue.closedAt;
    if (toStatus === 'resolved') resolvedAt = new Date().toISOString();
    else if (toStatus === 'closed') closedAt = new Date().toISOString();
    else if (toStatus === 'reopened') {
      resolvedAt = null; closedAt = null;
      const priority = this.calculatePriorityScore(issue.category, issue.evidenceConfidenceScore, issue.independentReportersCount, issue.createdAt, true);
      this.db.prepare('UPDATE issues SET priorityScore = ?, priorityBreakdown = ? WHERE id = ?').run(priority.score, JSON.stringify(priority.breakdown), issue.id);
    }
    this.db.prepare('UPDATE issues SET status = ?, updatedAt = ?, resolvedAt = ?, closedAt = ? WHERE id = ?').run(toStatus, new Date().toISOString(), resolvedAt, closedAt, issue.id);
    this.db.prepare('INSERT INTO status_history (id, issueId, fromStatus, toStatus, changedByUserId, changedByName, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(this.nextHistoryId++, issue.id, fromStatus, toStatus, changedByUserId, user?.displayName || 'System', note || `Status changed to ${toStatus}`, new Date().toISOString());
    const linkedComplaints = this.complaints.filter((c) => c.issueId === issueId);
    for (const c of linkedComplaints) this.sendStageNotification(c.id, toStatus, note);
    return this.issues.find(i => i.id === issue.id)!;
  }

  submitResolutionEvidence(params: { issueId: number; officerUserId: number; photoUrl: string; officerGpsLat: number | null; officerGpsLng: number | null; capturedAt: string; }): { issue: Issue; resolutionEvidence: ResolutionEvidence; verificationResult: 'matched' | 'needs_verification'; reason: string; } {
    const issue = this.issues.find((i) => i.id === params.issueId);
    if (!issue) throw new Error('Issue not found');
    const officer = this.users.find((u) => u.id === params.officerUserId);
    const RESOLUTION_TOLERANCE_METERS = 100;
    let verificationResult: 'matched' | 'needs_verification' = 'matched';
    let distanceM: number | null = null;
    let reason = 'Within 100m geospatial tolerance of original complaint.';
    if (params.officerGpsLat === null || params.officerGpsLng === null) {
      verificationResult = 'needs_verification'; reason = 'Resolution photo submitted without GPS coordinate fix.';
    } else {
      distanceM = this.getDistanceMeters(params.officerGpsLat, params.officerGpsLng, issue.representativeLat, issue.representativeLng);
      if (distanceM > RESOLUTION_TOLERANCE_METERS) {
        verificationResult = 'needs_verification'; reason = `Officer GPS is ${distanceM}m away from original report (exceeds ${RESOLUTION_TOLERANCE_METERS}m tolerance).`;
      }
    }
    const resId = this.nextResolutionId++;
    this.db.prepare('INSERT INTO resolution_evidence (id, issueId, officerUserId, officerName, photoUrl, officerGpsLat, officerGpsLng, capturedAt, distanceFromOriginalM, verificationResult, verificationReason, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(resId, issue.id, params.officerUserId, officer?.displayName || 'Officer', params.photoUrl, params.officerGpsLat, params.officerGpsLng, params.capturedAt, distanceM, verificationResult, reason, new Date().toISOString());
    const nextStatus: IssueStatus = verificationResult === 'matched' ? 'resolved' : 'needs_verification';
    const updatedIssue = this.updateIssueStatus(issue.id, nextStatus, params.officerUserId, reason);
    return { issue: updatedIssue, resolutionEvidence: this.resolutionEvidence.find(r => r.id === resId)!, verificationResult, reason };
  }

  getHotspots(): HotspotItem[] {
    const GRID_SIZE = 0.005; 
    const cellMap = new Map<string, { lat: number; lng: number; issues: Issue[] }>();
    for (const issue of this.issues) {
      const cellLat = Math.floor(issue.representativeLat / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
      const cellLng = Math.floor(issue.representativeLng / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
      const cellId = `${cellLat.toFixed(3)}_${cellLng.toFixed(3)}`;
      if (!cellMap.has(cellId)) cellMap.set(cellId, { lat: cellLat, lng: cellLng, issues: [] });
      cellMap.get(cellId)!.issues.push(issue);
    }
    this.db.prepare('DELETE FROM hotspots').run();
    const insertHotspot = this.db.prepare('INSERT INTO hotspots (gridCellId, lat, lng, issueCount, dominantCategory, riskLevel) VALUES (?, ?, ?, ?, ?, ?)');
    const hotspots: HotspotItem[] = [];
    for (const [cellId, cellData] of cellMap.entries()) {
      const issueCount = cellData.issues.length;
      const categoryCounts: Record<string, number> = {};
      for (const i of cellData.issues) categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
      let dominantCategory: IssueCategory = 'pothole';
      let maxCount = 0;
      for (const [cat, cnt] of Object.entries(categoryCounts)) {
        if (cnt > maxCount) { maxCount = cnt; dominantCategory = cat as IssueCategory; }
      }
      const riskLevel: 'high' | 'medium' | 'low' = issueCount >= 3 ? 'high' : issueCount >= 2 ? 'medium' : 'low';
      const hp = { gridCellId: cellId, lat: cellData.lat, lng: cellData.lng, issueCount, dominantCategory, riskLevel };
      hotspots.push(hp);
      insertHotspot.run(hp.gridCellId, hp.lat, hp.lng, hp.issueCount, hp.dominantCategory, hp.riskLevel);
    }
    return hotspots;
  }

  updateComplaintCategoryAndIssueRoute(complaintId: number, finalCategory: string) {
    const complaint = this.complaints.find((c) => c.id === complaintId);
    if (!complaint) return;
    this.db.prepare('UPDATE complaints SET finalCategory = ?, categorySource = ? WHERE id = ?').run(finalCategory, 'ai_overridden', complaintId);
    const issue = this.issues.find((i) => i.id === complaint.issueId);
    if (issue) {
      const { zone, department } = this.lookupJurisdiction(issue.representativeLat, issue.representativeLng, finalCategory as IssueCategory);
      this.db.prepare('UPDATE issues SET category = ?, jurisdictionZoneId = ?, jurisdictionZoneName = ?, wardLabel = ?, departmentId = ?, departmentName = ? WHERE id = ?').run(finalCategory, zone?.id || null, zone?.zoneName || null, zone?.wardLabel || null, department?.id || null, department?.name || null, issue.id);
    }
  }

}

export const db = new CitizenDatabase();
