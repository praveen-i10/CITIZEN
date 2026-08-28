export type UserRole = 'citizen' | 'officer' | 'admin';

export type IssueCategory =
  | 'pothole'
  | 'garbage'
  | 'streetlight'
  | 'drainage'
  | 'footpath'
  | 'road_damage'
  | 'water_supply'
  | 'other';

export type IssueStatus =
  | 'submitted'
  | 'acknowledged'
  | 'ongoing'
  | 'resolved'
  | 'closed'
  | 'reopened'
  | 'needs_verification';

export type EvidenceConfidenceBand = 'high' | 'needs_verification' | 'low';

export interface User {
  id: number;
  role: UserRole;
  displayName: string;
  phoneNumber: string;
  departmentId?: number;
  jurisdictionZoneId?: number;
  createdAt: string;
}

export interface Department {
  id: number;
  name: string;
  categoryTypes: IssueCategory[];
  isDemoData: number;
}

export interface JurisdictionZone {
  id: number;
  zoneName: string;
  localBodyType: 'corporation_zone' | 'municipality_demo' | 'panchayat_demo';
  wardLabel: string;
  departmentId: number;
  boundaryGeojson: {
    type: 'Polygon';
    coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
  };
  isDemoData: number;
}

export interface PriorityBreakdown {
  severity: number; // 0-100 (wt: 20%)
  publicExposure: number; // 0-100 (wt: 15%)
  vulnerablePopulation: number; // 0-100 (wt: 15%)
  criticalInfrastructure: number; // 0-100 (wt: 10%)
  duration: number; // 0-100 (wt: 10%)
  communityCorroboration: number; // 0-100 (wt: 10%)
  recurrence: number; // 0-100 (wt: 10%)
  evidenceConfidence: number; // 0-100 (wt: 10%)
}

export interface Issue {
  id: number;
  category: IssueCategory;
  status: IssueStatus;
  jurisdictionZoneId: number | null;
  jurisdictionZoneName?: string;
  wardLabel?: string;
  departmentId: number | null;
  departmentName?: string;
  representativeLat: number;
  representativeLng: number;
  evidenceConfidenceBand: EvidenceConfidenceBand;
  evidenceConfidenceScore: number; // 0.0 - 1.0
  priorityScore: number; // 0.0 - 100.0
  priorityBreakdown: PriorityBreakdown;
  needsManualRouting: boolean;
  complaintCount: number;
  independentReportersCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  complaints?: Complaint[];
  resolutionEvidence?: ResolutionEvidence | null;
  statusHistory?: StatusHistoryItem[];
}

export interface Complaint {
  id: number;
  referenceId: string;
  issueId: number;
  reporterUserId: number;
  reporterName?: string;
  descriptionText: string;
  descriptionSource: 'typed' | 'voice_transcript';
  voiceLanguageCode?: string | null;
  photoUrl: string;
  photoExifLat?: number | null;
  photoExifLng?: number | null;
  exifGpsMatch?: number | null;
  deviceGpsLat: number | null;
  deviceGpsLng: number | null;
  gpsIsApproximate: boolean;
  capturedAt: string;
  submittedAt?: string | null;
  aiSuggestedCategory?: IssueCategory | null;
  aiCategoryConfidence?: number | null;
  finalCategory: IssueCategory;
  categorySource: 'ai_confirmed' | 'ai_overridden' | 'manual_fallback';
  syncStatus: 'pending_sync' | 'submitted';
  duplicateLinkDecision?: 'linked_as_duplicate' | 'new_issue' | 'not_applicable' | null;
  isIndependentCorroboration: boolean;
  suspiciousFlag: boolean;
  suspiciousFlagReason?: string | null;
  photoHash?: string;
  createdAt: string;
}

export interface ResolutionEvidence {
  id: number;
  issueId: number;
  officerUserId: number;
  officerName?: string;
  photoUrl: string;
  officerGpsLat: number | null;
  officerGpsLng: number | null;
  capturedAt: string;
  distanceFromOriginalM: number | null;
  verificationResult: 'matched' | 'needs_verification';
  verificationReason?: string | null;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: number;
  issueId: number;
  fromStatus: IssueStatus | null;
  toStatus: IssueStatus;
  changedByUserId?: number | null;
  changedByName?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  complaintId: number;
  stage: IssueStatus;
  createdAt: string;
}

export interface SmsOutboxItem {
  id: number;
  notificationId: number;
  complaintReferenceId: string;
  toPhoneNumber: string;
  messageBody: string;
  sendStatus: 'sent_mock' | 'failed_simulated';
  createdAt: string;
}

export interface HotspotItem {
  gridCellId: string;
  lat: number;
  lng: number;
  issueCount: number;
  dominantCategory: IssueCategory;
  riskLevel: 'high' | 'medium' | 'low';
}

export interface DepartmentMetric {
  departmentId: number;
  departmentName: string;
  openCount: number;
  backlogCount: number;
  resolvedCount: number;
  avgResponseTimeHours: number | null; // e.g. 4.2 hours or null if no data
}

export interface DuplicateCandidate {
  issueId: number;
  distanceM: number;
  category: IssueCategory;
  existingComplaintCount: number;
  representativeLat: number;
  representativeLng: number;
  photoUrl?: string;
}
