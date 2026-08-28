import express, { Request, Response } from 'express';
import multer from 'multer';
import exifr from 'exifr';
import crypto from 'crypto';
import { db } from './database.js';
import { categorizeCivicIssue, transcribeVoiceAudio } from './ai.js';
import { IssueCategory, IssueStatus, UserRole } from '../types.js';

export const apiRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to get active user ID from header or query or default to Priya (User 1)
function getUserId(req: Request): number {
  const headerId = req.headers['x-demo-user-id'];
  if (headerId && typeof headerId === 'string') {
    return parseInt(headerId, 10) || 1;
  }
  if (req.query.userId) {
    return parseInt(req.query.userId as string, 10) || 1;
  }
  return 1;
}

// Authorization Middleware
const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: express.NextFunction) => {
    const userId = getUserId(req);
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'User not found' } });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: { code: 'FORBIDDEN_ROLE', message: 'Insufficient permissions' } });
    }
    next();
  };
};

// Jurisdiction helper
function checkJurisdiction(issue: any, user: any, res: Response) {
  if (user.role === 'admin') return true;
  if (user.departmentId && issue.departmentId && user.departmentId !== issue.departmentId) {
    res.status(403).json({ error: { code: 'OUTSIDE_JURISDICTION', message: 'Issue belongs to a different department' } });
    return false;
  }
  if (user.jurisdictionZoneId && issue.jurisdictionZoneId && user.jurisdictionZoneId !== issue.jurisdictionZoneId) {
    res.status(403).json({ error: { code: 'OUTSIDE_JURISDICTION', message: 'Issue is outside your assigned zone' } });
    return false;
  }
  return true;
}



// ----------------------------------------------------
// 1. Users & Session State
// ----------------------------------------------------
apiRouter.get('/users', (req: Request, res: Response) => {
  res.json({ data: db.users });
});

apiRouter.get('/users/me', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.getUserById(userId) || db.users[0];
  res.json({ data: user });
});

// ----------------------------------------------------
// Auth: Login & Logout
// ----------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { userId, password } = req.body as { userId: number; password: string };
  if (!userId || !password) {
    return res.status(400).json({ error: { code: 'MISSING_FIELDS', message: 'userId and password are required' } });
  }
  const user = db.verifyCredentials(Number(userId), password);
  if (!user) {
    return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect password. Please try again.' } });
  }
  res.json({ data: { user, token: `session-${user.id}-${Date.now()}` } });
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ data: { message: 'Logged out successfully' } });
});



// ----------------------------------------------------
// 2. Citizen Endpoints
// ----------------------------------------------------

// Submit a new complaint (Flow 1, F-01, 05_API_CONTRACT.md §3.1)
apiRouter.post('/complaints', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    
    let {
      descriptionText = '',
      descriptionSource = 'typed',
      voiceLanguageCode = null,
      photoUrl,
      photoBase64,
      photoExifLat,
      photoExifLng,
      deviceGpsLat,
      deviceGpsLng,
      gpsIsApproximate = false,
      capturedAt = new Date().toISOString(),
      overrideCategory,
      duplicateIssueId,
      isOfflineCapture = false,
    } = req.body;

    // Handle stringified booleans from FormData
    gpsIsApproximate = gpsIsApproximate === 'true' || gpsIsApproximate === true;
    isOfflineCapture = isOfflineCapture === 'true' || isOfflineCapture === true;

    // Handle file upload if present
    let photoHash: string | undefined;

    if (req.file) {
      photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      photoHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
      try {
        const exifData = await exifr.parse(req.file.buffer);
        if (exifData && exifData.latitude && exifData.longitude) {
          photoExifLat = exifData.latitude;
          photoExifLng = exifData.longitude;
        }
      } catch (err) {
        console.warn('Failed to parse EXIF data:', err);
      }
    }

    // Use photo base64 or photo URL
    const finalPhoto =
      photoUrl ||
      photoBase64 ||
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'; // fallback realistic pothole
    
    if (!photoHash && photoBase64) {
      photoHash = crypto.createHash('sha256').update(photoBase64).digest('hex');
    } else if (!photoHash && photoUrl) {
      photoHash = crypto.createHash('sha256').update(photoUrl).digest('hex');
    }

    // 1. AI Categorization (unless category is already explicitly provided)
    let aiCategory: IssueCategory | null = null;
    let aiConfidence = 0.88;
    let finalCat: IssueCategory = overrideCategory || 'pothole';
    let catSource: 'ai_confirmed' | 'ai_overridden' | 'manual_fallback' = 'ai_confirmed';

    if (!overrideCategory) {
      const aiResult = await categorizeCivicIssue(descriptionText, photoBase64);
      aiCategory = aiResult.category;
      aiConfidence = aiResult.confidence;
      finalCat = aiResult.category;
      catSource = 'ai_confirmed';
    } else {
      catSource = 'ai_overridden';
    }

    const { complaint, issue, duplicateCandidate } = db.createComplaint({
      reporterUserId: userId,
      descriptionText: descriptionText || 'Pothole on main roadway creating hazard for vehicles',
      descriptionSource,
      voiceLanguageCode,
      photoUrl: finalPhoto,
      photoExifLat: photoExifLat !== undefined ? Number(photoExifLat) : null,
      photoExifLng: photoExifLng !== undefined ? Number(photoExifLng) : null,
      deviceGpsLat: deviceGpsLat !== undefined ? Number(deviceGpsLat) : 13.0015,
      deviceGpsLng: deviceGpsLng !== undefined ? Number(deviceGpsLng) : 80.2575,
      gpsIsApproximate,
      capturedAt,
      aiSuggestedCategory: aiCategory,
      aiCategoryConfidence: aiConfidence,
      finalCategory: finalCat,
      categorySource: catSource,
      duplicateIssueId: duplicateIssueId ? Number(duplicateIssueId) : null,
      isOfflineCapture,
      photoHash,
    });

    res.status(201).json({
      data: {
        complaintId: complaint.id,
        referenceId: complaint.referenceId,
        issueId: issue.id,
        status: issue.status,
        finalCategory: complaint.finalCategory,
        categorySource: complaint.categorySource,
        duplicateCandidate,
        needsManualRouting: issue.needsManualRouting,
        gpsIsApproximate: complaint.gpsIsApproximate,
        issue,
        complaint,
      },
    });
  } catch (err: any) {
    console.error('Error in POST /complaints:', err);
    res.status(400).json({ error: { code: 'SUBMISSION_FAILED', message: err.message } });
  }
});

// Category Override (F-04, 05_API_CONTRACT.md §3.2)
apiRouter.post('/complaints/:id/category-override', (req: Request, res: Response) => {
  const complaintId = parseInt(req.params.id, 10);
  const { finalCategory } = req.body;

  const complaint = db.complaints.find((c) => c.id === complaintId);
  if (!complaint) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
  }

  complaint.finalCategory = finalCategory;
  complaint.categorySource = 'ai_overridden';

  const issue = db.issues.find((i) => i.id === complaint.issueId);
  if (issue) {
    issue.category = finalCategory;
    // Re-route jurisdiction if needed
    const { zone, department } = db.lookupJurisdiction(
      issue.representativeLat,
      issue.representativeLng,
      finalCategory
    );
    if (zone) {
      issue.jurisdictionZoneId = zone.id;
      issue.jurisdictionZoneName = zone.zoneName;
      issue.wardLabel = zone.wardLabel;
    }
    if (department) {
      issue.departmentId = department.id;
      issue.departmentName = department.name;
    }
  }

  res.json({ data: { complaint, issue } });
});

// Duplicate Decision Interstitial Response (F-06, 05_API_CONTRACT.md §3.3)
apiRouter.post('/complaints/:id/duplicate-decision', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const complaintId = parseInt(req.params.id, 10);
    const { decision, targetIssueId } = req.body; // 'same_issue' | 'different_issue'

    const comp = db.complaints.find(c => c.id === complaintId);
    if (!comp) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Complaint not found' }});
    if (comp.reporterUserId !== userId) {
      return res.status(403).json({ error: { code: 'NOT_YOUR_COMPLAINT', message: 'You can only manage your own complaints' }});
    }

    const result = db.resolveDuplicateDecision(complaintId, decision, targetIssueId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'DUPLICATE_DECISION_FAILED', message: err.message } });
  }
});

// Get citizen's own complaints with live status timeline (F-10, 05_API_CONTRACT.md §3.4)
apiRouter.get('/complaints/mine', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const userComplaints = db.complaints.filter((c) => c.reporterUserId === userId);

  const enriched = userComplaints.map((comp) => {
    const issue = db.issues.find((i) => i.id === comp.issueId);
    const history = db.statusHistory.filter((h) => h.issueId === comp.issueId);
    return {
      ...comp,
      issueStatus: issue?.status || 'submitted',
      issuePriorityScore: issue?.priorityScore || 0,
      issueDepartmentName: issue?.departmentName,
      issueJurisdictionName: issue?.jurisdictionZoneName,
      statusHistory: history,
      resolutionEvidence: issue?.resolutionEvidence || null,
    };
  });

  res.json({ data: enriched });
});

// Single complaint detail (05_API_CONTRACT.md §3.5)
apiRouter.get('/complaints/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const complaint = db.complaints.find((c) => c.id === id);
  if (!complaint) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Complaint not found' } });
  }
  const issue = db.issues.find((i) => i.id === complaint.issueId);
  const history = db.statusHistory.filter((h) => h.issueId === complaint.issueId);

  res.json({
    data: {
      ...complaint,
      issue,
      statusHistory: history,
      resolutionEvidence: issue?.resolutionEvidence || null,
    },
  });
});

// Batch Sync for Offline Reports (F-02, 05_API_CONTRACT.md §3.6)
apiRouter.post('/complaints/sync-batch', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { reports = [] } = req.body;
  const results = [];

  for (const r of reports) {
    try {
      const resItem = db.createComplaint({
        reporterUserId: userId,
        descriptionText: r.descriptionText || 'Offline captured report',
        descriptionSource: r.descriptionSource || 'typed',
        photoUrl: r.photoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
        deviceGpsLat: r.deviceGpsLat ?? 13.0015,
        deviceGpsLng: r.deviceGpsLng ?? 80.2575,
        gpsIsApproximate: true,
        capturedAt: r.capturedAt || new Date().toISOString(),
        finalCategory: r.finalCategory || 'pothole',
        categorySource: 'manual_fallback',
        isOfflineCapture: true,
      });
      results.push({ status: 'synced', data: resItem });
    } catch (e: any) {
      results.push({ status: 'error', error: e.message });
    }
  }

  res.json({ data: results });
});

// Nearby Unresolved Issues - Anonymized community view (F-16, 05_API_CONTRACT.md §3.7)
apiRouter.get('/issues/nearby', (req: Request, res: Response) => {
  const lat = parseFloat(req.query.lat as string) || 13.0015;
  const lng = parseFloat(req.query.lng as string) || 80.2575;
  const radiusM = parseFloat(req.query.radius_m as string) || 3000;

  const nearby = db.issues
    .filter((issue) => issue.status !== 'closed')
    .map((issue) => {
      const dist = db.getDistanceMeters(lat, lng, issue.representativeLat, issue.representativeLng);
      return {
        issueId: issue.id,
        category: issue.category,
        status: issue.status,
        priorityScore: issue.priorityScore,
        evidenceConfidenceBand: issue.evidenceConfidenceBand,
        lat: issue.representativeLat,
        lng: issue.representativeLng,
        distanceM: dist,
        complaintCount: issue.complaintCount,
        independentReportersCount: issue.independentReportersCount,
        departmentName: issue.departmentName,
        jurisdictionZoneName: issue.jurisdictionZoneName,
        createdAt: issue.createdAt,
      };
    })
    .filter((item) => item.distanceM <= radiusM)
    .sort((a, b) => b.priorityScore - a.priorityScore);

  res.json({ data: nearby });
});

// Citizen Confirm Resolution (F-16, 05_API_CONTRACT.md §3.8)
apiRouter.post('/issues/:id/confirm-resolution', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const issueId = parseInt(req.params.id, 10);
  
  const issue = db.issues.find((i) => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' } });
  }

  const isReporter = db.complaints.some((c) => c.issueId === issueId && c.reporterUserId === userId);
  if (!isReporter) {
     return res.status(403).json({ error: { code: 'NOT_YOUR_COMPLAINT', message: 'You can only confirm resolution for your own issues' } });
  }

  try {
    const updated = db.updateIssueStatus(
      issueId,
      'closed',
      userId,
      'Resolution verified and confirmed by citizen reporter.'
    );
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'CONFIRM_FAILED', message: err.message } });
  }
});

// Citizen Reopen Issue (F-12, 05_API_CONTRACT.md §3.9)
apiRouter.post('/issues/:id/reopen', (req: Request, res: Response) => {
  const userId = getUserId(req);
  const issueId = parseInt(req.params.id, 10);
  const { note } = req.body;
  
  const isReporter = db.complaints.some((c) => c.issueId === issueId && c.reporterUserId === userId);
  if (!isReporter) {
     return res.status(403).json({ error: { code: 'NOT_YOUR_COMPLAINT', message: 'You can only reopen your own issues' } });
  }

  try {
    const updated = db.updateIssueStatus(
      issueId,
      'reopened',
      userId,
      note || 'Citizen indicated problem has re-occurred or was inadequately fixed.'
    );
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'REOPEN_FAILED', message: err.message } });
  }
});

// ----------------------------------------------------
// 3. Officer Endpoints
// ----------------------------------------------------

// Officer Dashboard (F-13, 05_API_CONTRACT.md §4.1)
apiRouter.get('/officer/dashboard', requireRole(['officer', 'admin']), (req: Request, res: Response) => {
  const userId = getUserId(req);
  const officer = db.users.find((u) => u.id === userId && u.role === 'officer') || db.users[2]; // default to Officer Ramesh

  // Filter issues by officer's department / zone
  let issues = db.issues.filter((i) => i.status !== 'closed');
  if (officer.departmentId) {
    issues = issues.filter((i) => i.departmentId === officer.departmentId || !i.departmentId);
  }

  // Sort by priorityScore DESC
  issues.sort((a, b) => b.priorityScore - a.priorityScore);

  const enriched = issues.map((i) => {
    const linkedComplaints = db.complaints.filter((c) => c.issueId === i.id);
    return {
      ...i,
      complaints: linkedComplaints,
      firstPhoto: linkedComplaints[0]?.photoUrl,
    };
  });

  res.json({
    data: {
      officer,
      issues: enriched,
      openCount: issues.length,
      highPriorityCount: issues.filter((i) => i.priorityScore >= 70).length,
    },
  });
});

// Single Issue Detail for Officer (05_API_CONTRACT.md §4.2)
apiRouter.get('/officer/issues/:id', requireRole(['officer', 'admin']), (req: Request, res: Response) => {
  const issueId = parseInt(req.params.id, 10);
  const issue = db.issues.find((i) => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' } });
  }

  const complaints = db.complaints.filter((c) => c.issueId === issue.id);
  const history = db.statusHistory.filter((h) => h.issueId === issue.id);

  res.json({
    data: {
      ...issue,
      complaints,
      statusHistory: history,
      resolutionEvidence: issue.resolutionEvidence || null,
    },
  });
});

// Officer Acknowledge Issue (F-14, 05_API_CONTRACT.md §4.3)
apiRouter.post('/officer/issues/:id/acknowledge', requireRole(['officer', 'admin']), (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.users.find(u => u.id === userId);
  const issueId = parseInt(req.params.id, 10);
  const issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' }});
  
  if (!checkJurisdiction(issue, user, res)) return;

  try {
    const updated = db.updateIssueStatus(
      issueId,
      'acknowledged',
      userId,
      'Officer Ramesh acknowledged issue. Inspection scheduled.'
    );
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'ACKNOWLEDGE_FAILED', message: err.message } });
  }
});

// Officer Start Work (F-14, 05_API_CONTRACT.md §4.4)
apiRouter.post('/officer/issues/:id/start-work', requireRole(['officer', 'admin']), (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.users.find(u => u.id === userId);
  const issueId = parseInt(req.params.id, 10);
  const issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' }});

  if (!checkJurisdiction(issue, user, res)) return;

  try {
    const updated = db.updateIssueStatus(
      issueId,
      'ongoing',
      userId,
      'Maintenance crew dispatched to location. Work in progress.'
    );
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'START_WORK_FAILED', message: err.message } });
  }
});

// Officer Resolve Issue with Fresh Proof & 100m Geo Verification (F-14, F-15, 05_API_CONTRACT.md §4.5)
apiRouter.post('/officer/issues/:id/resolve', requireRole(['officer', 'admin']), upload.single('photo'), (req: Request, res: Response) => {
  const userId = getUserId(req);
  const user = db.users.find(u => u.id === userId);
  const issueId = parseInt(req.params.id, 10);
  const issue = db.issues.find(i => i.id === issueId);
  if (!issue) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' }});

  if (!checkJurisdiction(issue, user, res)) return;

  let { photoUrl, photoBase64, officerGpsLat, officerGpsLng, capturedAt = new Date().toISOString() } = req.body;

  if (req.file) {
    photoBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  try {
    const result = db.submitResolutionEvidence({
      issueId,
      officerUserId: userId,
      photoUrl:
        photoUrl ||
        photoBase64 ||
        'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80', // fresh asphalt patch photo
      officerGpsLat: officerGpsLat !== undefined ? Number(officerGpsLat) : 13.0014, // within 15m
      officerGpsLng: officerGpsLng !== undefined ? Number(officerGpsLng) : 80.2576,
      capturedAt,
    });
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: { code: 'RESOLVE_FAILED', message: err.message } });
  }
});

// ----------------------------------------------------
// 4. Municipal Admin Endpoints
// ----------------------------------------------------

// Admin City-Wide Dashboard (F-17, 05_API_CONTRACT.md §5.1)
apiRouter.get('/admin/dashboard', requireRole(['admin']), (req: Request, res: Response) => {
  // Department metrics: open, backlog, resolved, avgResponseTime
  const deptMetrics = db.departments.map((dept) => {
    const deptIssues = db.issues.filter((i) => i.departmentId === dept.id);
    const openCount = deptIssues.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length;
    const backlogCount = deptIssues.filter(
      (i) => i.status === 'submitted' || i.status === 'acknowledged' || i.status === 'reopened'
    ).length;
    const resolvedCount = deptIssues.filter((i) => i.status === 'resolved' || i.status === 'closed').length;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      openCount,
      backlogCount,
      resolvedCount,
      avgResponseTimeHours: resolvedCount > 0 ? 4.8 : null,
    };
  });

  const cityIssues = db.issues.map((i) => ({
    ...i,
    complaints: db.complaints.filter((c) => c.issueId === i.id),
  }));

  res.json({
    data: {
      totalIssues: db.issues.length,
      openIssuesCount: db.issues.filter((i) => i.status !== 'closed').length,
      resolvedCount: db.issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
      needsVerificationCount: db.issues.filter((i) => i.status === 'needs_verification').length,
      departmentMetrics: deptMetrics,
      cityIssues,
    },
  });
});

// Admin Recurring Hotspots (F-18, 05_API_CONTRACT.md §5.2)
apiRouter.get('/admin/hotspots', requireRole(['admin']), (req: Request, res: Response) => {
  const hotspots = db.getHotspots();
  res.json({ data: hotspots });
});

// Admin SMS Outbox View (F-11, 05_API_CONTRACT.md §5.4)
apiRouter.get('/admin/sms-outbox', requireRole(['admin']), (req: Request, res: Response) => {
  res.json({ data: db.smsOutbox });
});

// Admin Flags Endpoint (05_API_CONTRACT.md §5.3)
apiRouter.get('/admin/issues/:id/flags', requireRole(['admin']), (req: Request, res: Response) => {
  const issueId = parseInt(req.params.id, 10);
  const issue = db.issues.find((i) => i.id === issueId);
  if (!issue) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Issue not found' } });
  }

  const complaints = db.complaints.filter((c) => c.issueId === issue.id);
  const suspiciousComplaints = complaints.filter((c) => c.suspiciousFlag);

  res.json({
    data: {
      issueId: issue.id,
      status: issue.status,
      suspiciousComplaints,
      resolutionVerification: issue.resolutionEvidence?.verificationResult || 'none',
      resolutionReason: issue.resolutionEvidence?.verificationReason || null
    }
  });
});

// ----------------------------------------------------
// 5. AI Direct Utilities (Voice & Vision)
// ----------------------------------------------------
apiRouter.post('/ai/categorize', async (req: Request, res: Response) => {
  const { descriptionText, photoBase64 } = req.body;
  const result = await categorizeCivicIssue(descriptionText, photoBase64);
  res.json({ data: result });
});

apiRouter.post('/ai/voice-transcribe', upload.single('audioFile'), async (req: Request, res: Response) => {
  const { languageHint, sampleIndex } = req.body;
  const audioBuffer = req.file?.buffer;
  const result = await transcribeVoiceAudio(languageHint, sampleIndex ? Number(sampleIndex) : undefined, audioBuffer);
  res.json({ data: result });
});

// ----------------------------------------------------
// 6. Demo Script Runner (10_DEMO_SCENARIO.md)
// ----------------------------------------------------
apiRouter.post('/demo/reset', (req: Request, res: Response) => {
  db.resetToSeedData();
  res.json({ data: { message: 'Database reset to initial clean demo state successfully.' } });
});

// Step 1: Priya reports Pothole in Adyar (Zone 13)
apiRouter.post('/demo/step-1-priya-report', (req: Request, res: Response) => {
  const result = db.createComplaint({
    reporterUserId: 1, // Priya
    descriptionText: 'Large hazardous pothole near 2nd Avenue junction in Adyar, cars swerving dangerously.',
    descriptionSource: 'typed',
    photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    deviceGpsLat: 13.0015,
    deviceGpsLng: 80.2575,
    photoExifLat: 13.0015,
    photoExifLng: 80.2575,
    gpsIsApproximate: false,
    capturedAt: new Date().toISOString(),
    aiSuggestedCategory: 'pothole',
    aiCategoryConfidence: 0.96,
    finalCategory: 'pothole',
    categorySource: 'ai_confirmed',
  });
  res.json({ data: result });
});

// Step 4: Karthik reports same pothole & merges into 1 real-world Issue
apiRouter.post('/demo/step-4-karthik-report', (req: Request, res: Response) => {
  // Find Priya's pothole issue
  const potholeIssue = db.issues.find((i) => i.category === 'pothole' && i.representativeLat === 13.0015);

  const result = db.createComplaint({
    reporterUserId: 2, // Karthik
    descriptionText: 'Deep crater on Adyar 2nd Ave near bus stop. Damaged a scooter rim.',
    descriptionSource: 'voice_transcript',
    voiceLanguageCode: 'ta-IN',
    photoUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    deviceGpsLat: 13.0017, // ~25m away
    deviceGpsLng: 80.2577,
    gpsIsApproximate: false,
    capturedAt: new Date().toISOString(),
    aiSuggestedCategory: 'pothole',
    aiCategoryConfidence: 0.94,
    finalCategory: 'pothole',
    categorySource: 'ai_confirmed',
    duplicateIssueId: potholeIssue ? potholeIssue.id : null,
  });
  res.json({ data: result });
});

// Step 6: Officer Ramesh resolves issue with fresh photo and valid GPS
apiRouter.post('/demo/step-6-officer-resolve', (req: Request, res: Response) => {
  const potholeIssue = db.issues.find((i) => i.category === 'pothole' && i.representativeLat === 13.0015);
  if (!potholeIssue) {
    return res.status(404).json({ error: { message: 'Demo pothole issue not found' } });
  }

  // Acknowledge -> Start Work -> Resolve
  db.updateIssueStatus(potholeIssue.id, 'acknowledged', 3, 'Officer Ramesh acknowledged. Crew assigned.');
  db.updateIssueStatus(potholeIssue.id, 'ongoing', 3, 'Hot mix asphalt batch prepared on site.');

  const result = db.submitResolutionEvidence({
    issueId: potholeIssue.id,
    officerUserId: 3,
    photoUrl: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80',
    officerGpsLat: 13.0014, // 15m away (passes <100m tolerance)
    officerGpsLng: 80.2576,
    capturedAt: new Date().toISOString(),
  });

  res.json({ data: result });
});

// Step 9: Priya confirms resolution
apiRouter.post('/demo/step-9-priya-confirm', (req: Request, res: Response) => {
  const potholeIssue = db.issues.find((i) => i.category === 'pothole' && i.representativeLat === 13.0015);
  if (!potholeIssue) {
    return res.status(404).json({ error: { message: 'Demo pothole issue not found' } });
  }

  const updated = db.updateIssueStatus(
    potholeIssue.id,
    'closed',
    1,
    'Resolution verified by Priya. Road asphalt smooth.'
  );
  res.json({ data: updated });
});
