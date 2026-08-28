import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../context/AppContext.js';
import { IssueCategory, DuplicateCandidate } from '../../types.js';
import {
  Camera,
  Mic,
  MicOff,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Volume2,
  ChevronRight,
  Layers,
  Info,
} from 'lucide-react';

const SAMPLE_PHOTOS = [
  {
    id: 'pothole_adyar',
    label: 'Adyar 2nd Ave Pothole (Demo)',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
    lat: 13.0015,
    lng: 80.2575,
    locationName: '2nd Avenue, Adyar (Zone 13)',
  },
  {
    id: 'garbage_bin',
    label: 'Overflowing Waste Bin',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
    lat: 13.0335,
    lng: 80.2680,
    locationName: 'Luz Church Road, Mylapore',
  },
  {
    id: 'broken_light',
    label: 'Broken LED Streetlight',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80',
    lat: 13.0390,
    lng: 80.2320,
    locationName: 'North Usman Road, T. Nagar',
  },
  {
    id: 'water_leak',
    label: 'Pipeline Water Leak',
    url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=600&q=80',
    lat: 13.0825,
    lng: 80.2110,
    locationName: 'Anna Nagar 2nd Avenue',
  },
];

const CATEGORIES: { id: IssueCategory; label: string; icon: string; dept: string }[] = [
  { id: 'pothole', label: 'Pothole & Craters', icon: '🕳️', dept: 'Roads & Infrastructure' },
  { id: 'garbage', label: 'Garbage & Waste', icon: '🗑️', dept: 'Solid Waste Management' },
  { id: 'streetlight', label: 'Streetlight & Electrical', icon: '💡', dept: 'Electrical Works' },
  { id: 'drainage', label: 'Drainage & Sewage Overflow', icon: '🌊', dept: 'Water Supply & Sewerage' },
  { id: 'footpath', label: 'Damaged Footpath / Pavers', icon: '🚶', dept: 'Roads & Infrastructure' },
  { id: 'road_damage', label: 'Road Damage / Resurfacing', icon: '🚧', dept: 'Roads & Infrastructure' },
  { id: 'water_supply', label: 'Drinking Water Pipeline', icon: '🚰', dept: 'Metro Water' },
  { id: 'other', label: 'Other Civic Issue', icon: '📍', dept: 'General Public Works' },
];

interface ReportIssueWizardProps {
  onFinish: () => void;
}

export const ReportIssueWizard: React.FC<ReportIssueWizardProps> = ({ onFinish }) => {
  const { currentUser, isOffline, addOfflineReport, triggerRefresh } = useApp();

  // Wizard Steps: 1: Capture Photo, 2: Description & Voice, 3: AI Category, 4: Duplicate Check, 5: Submitted
  const [step, setStep] = useState<number>(1);

  // Form State
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Unknown Location');
  const [timestamp, setTimestamp] = useState<string>(new Date().toISOString());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [gpsIsFallback, setGpsIsFallback] = useState<boolean>(false);

  // Get real GPS
  const fetchGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLabel(`GPS Location (Accuracy: ${Math.round(pos.coords.accuracy)}m)`);
          setGpsIsFallback(false);
        },
        (err) => {
          console.warn('GPS error', err);
          setGpsCoords({ lat: 13.0015, lng: 80.2575 });
          setLocationLabel('GPS Blocked - Using Fallback');
          setGpsIsFallback(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      setGpsCoords({ lat: 13.0015, lng: 80.2575 });
      setLocationLabel('GPS Unsupported - Using Fallback');
      setGpsIsFallback(true);
    }
  };

  // Camera stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Description & Voice State
  const [description, setDescription] = useState<string>(
    'Large hazardous pothole near 2nd Avenue junction in Adyar, cars and bikes are swerving dangerously.'
  );
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceLang, setVoiceLang] = useState<string>('ta-IN');
  const [descriptionSource, setDescriptionSource] = useState<'typed' | 'voice_transcript'>('typed');

  // AI Categorization State
  const [aiSuggestedCategory, setAiSuggestedCategory] = useState<IssueCategory>('pothole');
  const [aiConfidence, setAiConfidence] = useState<number>(0.95);
  const [aiReasoning, setAiReasoning] = useState<string>(
    'Multimodal vision analysis identified deep asphalt depression in active traffic lane.'
  );
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>('pothole');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Submission / Duplicate State
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdComplaintId, setCreatedComplaintId] = useState<number | null>(null);
  const [referenceId, setReferenceId] = useState<string>('');
  const [duplicateCandidate, setDuplicateCandidate] = useState<DuplicateCandidate | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Start in-app webcam
  const startCamera = async () => {
    fetchGps();
    try {
      setCameraError(null);
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true); // mount <video> first; stream is attached in useEffect below
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera stream unavailable. Use "Capture / Upload Photo" to select or take a photo from your phone.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhotoUrl(dataUrl);
        setCapturedFile(null);
        setTimestamp(new Date().toISOString());
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fetchGps();
      setCapturedFile(file);
      setCapturedPhotoUrl(URL.createObjectURL(file));
      setTimestamp(new Date().toISOString());
      stopCamera();
    }
  };

  // Attach the stream only after the <video> element actually exists in the DOM
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch((e) => console.warn('Autoplay error:', e));
      };
    }
  }, [cameraActive]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Voice recording & Sarvam AI transcription
  const handleVoiceTranscription = async (lang: string) => {
    setIsRecording(true);
    setVoiceLang(lang);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      // Set up the onstop promise BEFORE starting/stopping to avoid race condition
      const audioBlobPromise = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(audioChunks, { type: 'audio/webm' }));
        };
      });

      mediaRecorder.start();
      
      // Record for 3 seconds
      await new Promise(resolve => setTimeout(resolve, 3000));
      mediaRecorder.stop();

      const audioBlob = await audioBlobPromise;
      
      stream.getTracks().forEach(track => track.stop());

      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'voice.webm');
      formData.append('languageHint', lang);
      formData.append('sampleIndex', '0');

      const res = await fetch('/api/v1/ai/voice-transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data?.data) {
        setDescription(data.data.transcript);
        setDescriptionSource('voice_transcript');
      }
    } catch (err) {
      console.warn('Voice transcription fallback:', err);
    } finally {
      setIsRecording(false);
    }
  };


  // Run AI Categorization and Auto-Submit (Bypass Step 3)
  const handleRunAiCategorization = async () => {
    setIsAiLoading(true);

    try {
      let b64 = capturedPhotoUrl || '';
      if (capturedFile) {
         const reader = new FileReader();
         b64 = await new Promise((resolve) => {
           reader.onloadend = () => resolve(reader.result as string);
           reader.readAsDataURL(capturedFile);
         });
      }

      const res = await fetch('/api/v1/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descriptionText: description,
          photoBase64: b64.startsWith('data:') ? b64 : undefined,
        }),
      });
      const data = await res.json();
      if (data?.data) {
        if (data.data.category === 'invalid') {
          alert('AI Verification Failed: ' + data.data.reasoning + '\n\nPlease capture a valid civic issue to report.');
          setIsAiLoading(false);
          return;
        }

        setAiSuggestedCategory(data.data.category);
        setAiConfidence(data.data.confidence);
        setAiReasoning(data.data.reasoning);
        setSelectedCategory(data.data.category);
        
        // Auto-submit immediately
        await handleSubmit(undefined, data.data.category);
      }
    } catch (e) {
      console.warn('AI categorization request failed, using local fallback:', e);
      await handleSubmit();
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Complaint
  const handleSubmit = async (duplicateIssueId?: number, overrideCategoryParam?: string) => {
    setSubmitting(true);
    const finalCategory = overrideCategoryParam || selectedCategory;

    if (isOffline && gpsCoords) {
      // Queue offline
      addOfflineReport({
        descriptionText: description,
        descriptionSource,
        voiceLanguageCode: voiceLang,
        photoUrl: capturedPhotoUrl || '',
        deviceGpsLat: gpsCoords.lat,
        deviceGpsLng: gpsCoords.lng,
        capturedAt: timestamp,
        finalCategory: finalCategory,
      });
      setReferenceId(`OFFLINE-${Date.now().toString().slice(-4)}`);
      setStep(5);
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('descriptionText', description);
      formData.append('descriptionSource', descriptionSource);
      formData.append('voiceLanguageCode', voiceLang);
      
      if (gpsCoords) {
        formData.append('deviceGpsLat', String(gpsCoords.lat));
        formData.append('deviceGpsLng', String(gpsCoords.lng));
      }
      formData.append('gpsIsApproximate', gpsIsFallback ? 'true' : 'false');
      formData.append('capturedAt', timestamp);
      formData.append('overrideCategory', finalCategory);
      if (duplicateIssueId) {
        formData.append('duplicateIssueId', String(duplicateIssueId));
      }

      if (capturedFile) {
        formData.append('photo', capturedFile);
      } else if (capturedPhotoUrl && capturedPhotoUrl.startsWith('data:')) {
        const res = await fetch(capturedPhotoUrl);
        const blob = await res.blob();
        formData.append('photo', blob, 'capture.jpg');
      } else if (capturedPhotoUrl) {
        formData.append('photoUrl', capturedPhotoUrl);
      }

      const res = await fetch('/api/v1/complaints', {
        method: 'POST',
        headers: {
          'x-demo-user-id': String(currentUser.id),
        },
        body: formData,
      });

      const json = await res.json();
      if (json?.data) {
        setCreatedComplaintId(json.data.complaintId);
        setReferenceId(json.data.referenceId);
        setSubmissionResult(json.data);

        // Check if duplicate candidate was found and we haven't already confirmed
        if (json.data.duplicateCandidate && !duplicateIssueId && step !== 4) {
          setDuplicateCandidate(json.data.duplicateCandidate);
          setStep(4); // Show Duplicate Interstitial
        } else {
          setStep(5); // Show Confirmation
          triggerRefresh();
        }
      }
    } catch (err: any) {
      alert('Submission failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Duplicate Decision
  const handleDuplicateDecision = async (isSame: boolean) => {
    if (!createdComplaintId || !duplicateCandidate) {
      setStep(5);
      return;
    }

    try {
      setSubmitting(true);
      await fetch(`/api/v1/complaints/${createdComplaintId}/duplicate-decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: isSame ? 'same_issue' : 'different_issue',
          targetIssueId: isSame ? duplicateCandidate.issueId : undefined,
        }),
      });
      triggerRefresh();
      setStep(5);
    } catch (err: any) {
      alert('Error updating duplicate decision: ' + err.message);
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-blue-400/20 to-purple-400/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Step Progress Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 tracking-wider uppercase">
          <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md">STEP {step} OF 5</span>
          <span className="bg-white/50 px-3 py-1 rounded-full border border-slate-200/50 backdrop-blur-sm">
            {step === 1 && '1. Evidence Capture'}
            {step === 2 && '2. Voice & Details'}
            {step === 3 && '3. AI Routing'}
            {step === 4 && '4. Duplicate Check'}
            {step === 5 && '5. Issue Logged'}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200/50 rounded-full overflow-hidden flex backdrop-blur-sm shadow-inner">
          <motion.div
            layout
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full shadow-sm"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </motion.div>

      {/* ---------------------------------------------------- */}
      {/* STEP 1: CAMERA EVIDENCE CAPTURE (F-01, C-2) */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence mode="wait">
      {step === 1 && (
        <motion.div 
          key="step1"
          initial={{ opacity: 0, scale: 0.98, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -15 }}
          className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 space-y-6"
        >
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>Capture Fresh In-App Photo</span>
            </h2>
            <p className="text-xs text-slate-500">
              Camera-first evidence attaches locked GPS coordinates and timestamp to eliminate fraudulent submissions.
            </p>
          </div>

          {/* Camera Viewfinder / Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center border border-slate-800 shadow-inner group">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              capturedPhotoUrl ? (
                <img
                  src={capturedPhotoUrl}
                  alt="Captured Evidence"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 opacity-50" />
                  <span>No Evidence Captured</span>
                </div>
              )
            )}

            {/* Geotag & Timestamp Chip Overlay */}
            {gpsCoords && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 bg-slate-900/60 backdrop-blur-xl text-white px-3.5 py-2 rounded-xl text-xs space-y-1 border border-white/10 shadow-xl"
              >
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>GPS Locked: {gpsCoords.lat.toFixed(4)}° N, {gpsCoords.lng.toFixed(4)}° E</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(timestamp).toLocaleTimeString()} · {locationLabel}</span>
                </div>
              </motion.div>
            )}

            {/* In-Viewfinder Capture Button */}
            {cameraActive && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-5 inset-x-0 flex justify-center"
              >
                <button
                  onClick={captureFrame}
                  className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/50 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 group-hover:border-white"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Camera controls & preset samples */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 transition"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                <span>{cameraActive ? 'Close Live Camera' : 'Open Device Camera'}</span>
              </button>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-50 transition cursor-pointer">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Native Upload (EXIF)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload}
                  className="hidden" 
                />
              </label>
            </div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-2 cursor-pointer" onClick={() => setIsDemoMode(!isDemoMode)}>
                <Info className="w-4 h-4" /> Demo Mode {isDemoMode ? '(Active)' : '(Hidden)'}
              </span>
            </div>

            {cameraError && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                {cameraError}
              </p>
            )}

            {/* Quick Demo Photo Presets */}
            {isDemoMode && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {SAMPLE_PHOTOS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setCapturedPhotoUrl(sample.url);
                      setCapturedFile(null);
                      setGpsCoords({ lat: sample.lat, lng: sample.lng });
                      setLocationLabel(sample.locationName);
                      setTimestamp(new Date().toISOString());
                    }}
                    className={`p-2 rounded-xl border text-left transition flex flex-col gap-1.5 ${
                      capturedPhotoUrl === sample.url
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.label}
                      className="w-full h-16 object-cover rounded-lg"
                    />
                    <span className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-tight">
                      {sample.label}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">{sample.locationName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!capturedPhotoUrl}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-7 py-3 rounded-xl text-sm font-bold shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <span>Next: Add Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 2: VOICE & DESCRIPTION (F-01, F-03, C-3) */}
      {/* ---------------------------------------------------- */}
      {step === 2 && (
        <motion.div 
          key="step2"
          initial={{ opacity: 0, scale: 0.98, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.98, x: -20 }}
          className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 space-y-6"
        >
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Mic className="w-5 h-5 text-blue-600" />
              <span>Describe the Issue</span>
            </h2>
            <p className="text-xs text-slate-500">
              Speak in Tamil, Hindi, or English. Audio is transcribed via Sarvam AI and remains fully editable.
            </p>
          </div>

          {/* Voice Input Buttons (F-03 Sarvam Demo) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-blue-600" />
                <span>Multi-Language Voice Input</span>
              </span>
              {isRecording && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  Transcribing with Sarvam AI...
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleVoiceTranscription('ta-IN')}
                disabled={isRecording}
                className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 py-2 px-3 rounded-lg text-xs font-bold text-slate-800 transition"
              >
                <Mic className="w-3.5 h-3.5 text-blue-600" />
                <span>தமிழ் (Tamil)</span>
              </button>

              <button
                type="button"
                onClick={() => handleVoiceTranscription('hi-IN')}
                disabled={isRecording}
                className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 py-2 px-3 rounded-lg text-xs font-bold text-slate-800 transition"
              >
                <Mic className="w-3.5 h-3.5 text-purple-600" />
                <span>हिंदी (Hindi)</span>
              </button>

              <button
                type="button"
                onClick={() => handleVoiceTranscription('en-IN')}
                disabled={isRecording}
                className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 py-2 px-3 rounded-lg text-xs font-bold text-slate-800 transition"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>English</span>
              </button>
            </div>
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Issue Details (Editable Transcript)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setDescriptionSource('typed');
              }}
              placeholder="e.g. Deep pothole near the bus stop, traffic swerving..."
              className="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed bg-white"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Source: {descriptionSource === 'voice_transcript' ? `Voice (${voiceLang})` : 'Manual typing'}</span>
              <span>{description.length} characters</span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100/50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={handleRunAiCategorization}
              disabled={isAiLoading || submitting}
              className="relative inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-7 py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden group"
            >
              {/* Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
              
              {isAiLoading || submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>AI Routing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Submit with AI (Auto-Route)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}



      {/* ---------------------------------------------------- */}
      {/* STEP 4: DUPLICATE VERIFICATION INTERSTITIAL (F-06, C-5) */}
      {/* ---------------------------------------------------- */}
      {step === 4 && duplicateCandidate && (
        <motion.div 
          key="step4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 space-y-6"
        >
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded-full text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Nearby Similar Issue Detected (Within 75m)</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-2">
              Is this the same issue?
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              We found an existing open {duplicateCandidate.category} report {duplicateCandidate.distanceM} meters away
              with {duplicateCandidate.existingComplaintCount} prior report(s).
            </p>
          </div>

          {/* Matched Issue Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Existing Issue #{duplicateCandidate.issueId}</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                {duplicateCandidate.existingComplaintCount} Community Report(s)
              </span>
            </div>

            {duplicateCandidate.photoUrl && (
              <img
                src={duplicateCandidate.photoUrl}
                alt="Existing report"
                className="w-full h-36 object-cover rounded-lg border border-slate-200"
              />
            )}

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong>Category:</strong> {duplicateCandidate.category.toUpperCase()}
              </p>
              <p>
                <strong>Distance from your GPS:</strong> {duplicateCandidate.distanceM} meters
              </p>
              <p className="text-[11px] text-slate-500 italic">
                * Note: Linking your report confirms community corroboration and increases the priority score for faster municipal action.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleDuplicateDecision(true)}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Yes, Same Issue (Merge & Corroborate)</span>
            </button>

            <button
              onClick={() => handleDuplicateDecision(false)}
              disabled={submitting}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition"
            >
              <span>No, This is Different</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ---------------------------------------------------- */}
      {/* STEP 5: REGISTRATION RECEIPT (F-01, C-6) */}
      {/* ---------------------------------------------------- */}
      {step === 5 && (
        <motion.div 
          key="step5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-3xl rounded-3xl border border-white shadow-2xl p-8 text-center space-y-6 overflow-hidden relative"
        >
          {/* Confetti / Success ambient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
          
          <motion.div 
            initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
            className="w-20 h-20 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-slate-900">
              {isOffline ? 'Report Queued Offline' : 'Complaint Successfully Registered!'}
            </h2>
            <p className="text-xs text-slate-500">
              {isOffline
                ? 'Your evidence is safely stored on device and will sync when you are back online.'
                : 'Your report has been geotagged, risk-scored, and routed to the municipal ward department.'}
            </p>
          </div>

          {/* Reference Receipt Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left space-y-3 font-mono text-xs max-w-md mx-auto">
            <div className="flex justify-between border-b border-slate-200 pb-2 font-sans font-bold text-slate-800">
              <span>Receipt Details</span>
              <span className="text-blue-600 font-bold">STATUS: SUBMITTED</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Reference ID:</span>
              <span className="font-bold text-slate-900">{referenceId}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Reporter:</span>
              <span className="text-slate-900">{currentUser.displayName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Category:</span>
              <span className="text-slate-900 capitalize">{selectedCategory}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Assigned Zone:</span>
              <span className="text-slate-900">Zone 13 - Adyar (Ward 175)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Target Department:</span>
              <span className="text-slate-900">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.dept || 'Roads & Infra'}
              </span>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onFinish}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white px-7 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all"
            >
              <span>View in "My Reports"</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setStep(1);
                setCapturedPhotoUrl(null);
                setCapturedFile(null);
                setGpsCoords(null);
                setGpsIsFallback(false);
                setLocationLabel('Unknown Location');
                setTimestamp(new Date().toISOString());
                setDescription('Large hazardous pothole near 2nd Avenue junction in Adyar, cars and bikes are swerving dangerously.');
                setDescriptionSource('typed');
                setAiSuggestedCategory('pothole');
                setSelectedCategory('pothole');
                setDuplicateCandidate(null);
                setCreatedComplaintId(null);
                setReferenceId('');
                setSubmissionResult(null);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Report Another Issue</span>
            </button>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
