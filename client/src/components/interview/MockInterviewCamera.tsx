import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Video,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
  Clock,
} from 'lucide-react';
import { api } from '../../lib/api';

interface MockInterviewCameraProps {
  sessionId?: string;
  isInterviewActive: boolean;
  onAttentionEvent?: (eventType: string, details?: any) => void;
  onSuspended?: (suspension: any) => void;
  className?: string;
}

export const MockInterviewCamera: React.FC<MockInterviewCameraProps> = ({
  sessionId,
  isInterviewActive,
  onAttentionEvent,
  onSuspended,
  className = '',
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cvCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioCheckIntervalRef = useRef<any | null>(null);
  const visionCheckIntervalRef = useRef<any | null>(null);

  // Media & Device State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSimulatedStream, setIsSimulatedStream] = useState<boolean>(false);

  // 3-Strike Warning & Violation State
  const [eyeStrikes, setEyeStrikes] = useState<number>(0);
  const [noiseStrikes, setNoiseStrikes] = useState<number>(0);
  const [activeAlert, setActiveAlert] = useState<{
    type: 'EYE' | 'NOISE' | 'BAN';
    message: string;
    strikeNumber: number;
  } | null>(null);

  // Real-time Metrics
  const [isGazeCentered, setIsGazeCentered] = useState<boolean>(true);
  const [currentDecibels, setCurrentDecibels] = useState<number>(32);
  const [isNoiseHigh, setIsNoiseHigh] = useState<boolean>(false);
  const [isBanned, setIsBanned] = useState<boolean>(false);
  const [banDetails, setBanDetails] = useState<{
    reason: string;
    suspendedUntil: string;
    remainingSeconds: number;
  } | null>(null);

  // Consecutive counters for debouncing deviations
  const gazeOffCounterRef = useRef<number>(0);
  const highNoiseCounterRef = useRef<number>(0);
  const isCooldownRef = useRef<boolean>(false);

  // Stop tracks & AudioContext cleanly
  const stopAllMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioCheckIntervalRef.current) {
      clearInterval(audioCheckIntervalRef.current);
      audioCheckIntervalRef.current = null;
    }
    if (visionCheckIntervalRef.current) {
      clearInterval(visionCheckIntervalRef.current);
      visionCheckIntervalRef.current = null;
    }
  }, []);

  // Dispatch violation to backend with 3-strike rule and 4th strike 3-day ban
  const handleTriggerViolation = useCallback(
    async (type: 'EYE' | 'NOISE', simulatedStrike?: number) => {
      if (isBanned || isCooldownRef.current) return;

      isCooldownRef.current = true;
      setTimeout(() => {
        isCooldownRef.current = false;
      }, 3500);

      const nextStrike = simulatedStrike !== undefined
        ? simulatedStrike
        : type === 'EYE'
        ? eyeStrikes + 1
        : noiseStrikes + 1;

      if (type === 'EYE') {
        setEyeStrikes(nextStrike);
      } else {
        setNoiseStrikes(nextStrike);
      }

      const isBanTrigger = nextStrike > 3;
      const alertMsg = isBanTrigger
        ? `3-Day Suspension Triggered! Repeated ${type === 'EYE' ? 'eye gaze' : 'background noise'} violations (>3 times). Mock Interviews and DSA questions are locked.`
        : nextStrike === 3
        ? `FINAL WARNING (3/3): ${type === 'EYE' ? 'Eye movement away from screen detected.' : 'Background noise detected.'} One more violation will trigger an immediate 3-day ban!`
        : `Warning ${nextStrike}/3: ${type === 'EYE' ? 'Looking away from screen detected. Please maintain eye contact.' : 'Background chatter or noise detected. Ensure a quiet environment.'}`;

      setActiveAlert({
        type: isBanTrigger ? 'BAN' : type,
        message: alertMsg,
        strikeNumber: nextStrike,
      });

      if (!isBanTrigger) {
        setTimeout(() => {
          setActiveAlert((prev) => (prev?.strikeNumber === nextStrike ? null : prev));
        }, 4500);
      }

      onAttentionEvent?.(type === 'EYE' ? 'EYE_GAZE_VIOLATION' : 'NOISE_VIOLATION', {
        strikeCount: nextStrike,
      });

      if (sessionId) {
        try {
          const res = await api.post<any>('/mock-interview/attention-event', {
            sessionId,
            eventType: type === 'EYE' ? 'EYE_GAZE_VIOLATION' : 'NOISE_VIOLATION',
            strikeCount: nextStrike,
            details: {
              strikeCount: nextStrike,
              maxStrikes: 3,
              timestamp: Date.now(),
            },
          });

          if (res.isSuspended) {
            setIsBanned(true);
            setBanDetails({
              reason: res.reason || alertMsg,
              suspendedUntil: res.suspendedUntil,
              remainingSeconds: res.remainingSeconds || 259200,
            });
            onSuspended?.(res);
            stopAllMedia();
          }
        } catch (err: any) {
          if (err?.response?.status === 403 && err?.response?.data?.error) {
            const errData = err.response.data.error;
            setIsBanned(true);
            setBanDetails({
              reason: errData.reason || alertMsg,
              suspendedUntil: errData.suspendedUntil,
              remainingSeconds: errData.remainingSeconds || 259200,
            });
            onSuspended?.(errData);
            stopAllMedia();
          }
        }
      }
    },
    [eyeStrikes, noiseStrikes, isBanned, sessionId, onAttentionEvent, onSuspended, stopAllMedia]
  );

  // Setup Web Audio API for Background Noise Analysis
  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      if (audioCheckIntervalRef.current) clearInterval(audioCheckIntervalRef.current);

      audioCheckIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || isBanned) return;

        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute RMS audio energy
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sumSquares += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);

        // Map to estimated decibels (25dB to 85dB range)
        const decibels = Math.min(85, Math.max(25, Math.round(25 + (rms / 255) * 60)));
        setCurrentDecibels(decibels);

        // Ambient noise threshold: above 52 dB is considered noticeable background noise
        if (decibels >= 52) {
          highNoiseCounterRef.current += 1;
          setIsNoiseHigh(true);

          // If sustained noise occurs for > 4 checks (approx 1.6 - 2.0 seconds)
          if (highNoiseCounterRef.current >= 4 && !isCooldownRef.current) {
            highNoiseCounterRef.current = 0;
            handleTriggerViolation('NOISE');
          }
        } else {
          highNoiseCounterRef.current = Math.max(0, highNoiseCounterRef.current - 1);
          setIsNoiseHigh(false);
        }
      }, 400);
    } catch (e) {
      console.warn('Audio analysis initialization failed:', e);
    }
  }, [handleTriggerViolation, isBanned]);

  // Setup Offscreen Canvas Vision Analysis for Eye Movement & Gaze Deviation
  const setupVisionAnalysis = useCallback(() => {
    if (visionCheckIntervalRef.current) clearInterval(visionCheckIntervalRef.current);

    visionCheckIntervalRef.current = setInterval(() => {
      if (!isCameraActive || isBanned || isSimulatedStream) return;

      const video = videoRef.current;
      if (!video || video.readyState < 2) return;

      let cvCanvas = cvCanvasRef.current;
      if (!cvCanvas) {
        cvCanvas = document.createElement('canvas');
        cvCanvasRef.current = cvCanvas;
      }
      cvCanvas.width = 64;
      cvCanvas.height = 48;
      const ctx = cvCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, cvCanvas.width, cvCanvas.height);
      const frame = ctx.getImageData(0, 0, cvCanvas.width, cvCanvas.height);
      const data = frame.data;

      // Calculate center vs lateral luminance balance in the upper head/eye region
      let leftWeight = 0;
      let rightWeight = 0;
      let centerWeight = 0;

      // Analyze upper third of frame where eyes/forehead reside
      const eyeRegionEndY = Math.floor(cvCanvas.height * 0.55);
      for (let y = 5; y < eyeRegionEndY; y++) {
        for (let x = 8; x < cvCanvas.width - 8; x++) {
          const idx = (y * cvCanvas.width + x) * 4;
          const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;

          if (x < cvCanvas.width * 0.38) {
            leftWeight += brightness;
          } else if (x > cvCanvas.width * 0.62) {
            rightWeight += brightness;
          } else {
            centerWeight += brightness;
          }
        }
      }

      const lateralDiff = Math.abs(leftWeight - rightWeight) / (centerWeight + 1);

      // If lateral difference is unusually large or center eye brightness drops (user turned head / looked away)
      const isDeviating = lateralDiff > 0.85 || centerWeight < (leftWeight + rightWeight) * 0.25;

      if (isDeviating) {
        gazeOffCounterRef.current += 1;
        setIsGazeCentered(false);

        // If eyes remain deviated for 4 checks (~2.0 seconds)
        if (gazeOffCounterRef.current >= 4 && !isCooldownRef.current) {
          gazeOffCounterRef.current = 0;
          handleTriggerViolation('EYE');
        }
      } else {
        gazeOffCounterRef.current = Math.max(0, gazeOffCounterRef.current - 1);
        setIsGazeCentered(true);
      }
    }, 500);
  }, [isCameraActive, isBanned, isSimulatedStream, handleTriggerViolation]);

  // Simulated canvas test feed when camera is in test mode or unavailable
  const startSimulatedFeed = useCallback(() => {
    stopAllMedia();
    setIsSimulatedStream(true);
    setCameraError(null);
    setIsCameraActive(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = 0;
    const render = () => {
      frame++;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Candidate Silhouette
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 - 10 + Math.sin(frame * 0.05) * 3;

      // Head
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(centerX, centerY - 15, 36, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 55, 65, 35, 0, 0, Math.PI);
      ctx.fill();

      // Eye movement animation in simulated mode
      const eyeOffset = isGazeCentered ? 0 : Math.sin(frame * 0.1) * 8;

      ctx.fillStyle = isGazeCentered ? '#14b8a6' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(centerX - 14 + eyeOffset, centerY - 18, 3, 0, Math.PI * 2);
      ctx.arc(centerX + 14 + eyeOffset, centerY - 18, 3, 0, Math.PI * 2);
      ctx.fill();

      // Proctor Reticle
      ctx.strokeStyle = isGazeCentered ? '#14b8a6' : '#f43f5e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(centerX - 42, centerY - 55, 84, 90);

      // Text watermark
      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        isGazeCentered ? 'EYE GAZE CENTERED • AI PROCTOR ACTIVE' : '⚠ EYE GAZE DEVIATION DETECTED',
        centerX,
        canvas.height - 15
      );

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  }, [stopAllMedia, isGazeCentered]);

  // Request actual user webcam & microphone
  const startWebcam = useCallback(async () => {
    stopAllMedia();
    setCameraError(null);
    setIsSimulatedStream(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Webcam API is not supported in this browser. Using Virtual Proctor Feed.');
      startSimulatedFeed();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }

      setIsCameraActive(true);
      setupAudioAnalysis(stream);
      setupVisionAnalysis();
    } catch (err: any) {
      console.warn('Camera/Mic access failed:', err.name, err.message);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera/Mic permission was denied. Use Virtual Test Mode or allow browser access.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No physical camera device detected. Engaging Virtual Test Mode.');
        startSimulatedFeed();
      } else {
        setCameraError(err.message || 'Could not initialize camera stream.');
      }
    }
  }, [stopAllMedia, startSimulatedFeed, setupAudioAnalysis, setupVisionAnalysis]);

  // Lifecycle
  useEffect(() => {
    if (isInterviewActive && !isBanned) {
      startWebcam();
    } else {
      stopAllMedia();
      setIsCameraActive(false);
    }

    return () => {
      stopAllMedia();
    };
  }, [isInterviewActive, isBanned, startWebcam, stopAllMedia]);

  return (
    <div
      className={`rounded-2xl border border-console-border bg-console-panel-raised overflow-hidden shadow-lg flex flex-col relative transition-all duration-200 ${className}`}
    >
      {/* Top Header Bar */}
      <div className="px-3 py-1.5 border-b border-console-border flex items-center justify-between bg-console-bg/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isBanned
                  ? 'bg-status-red animate-ping'
                  : isCameraActive
                  ? 'bg-status-green animate-pulse'
                  : 'bg-status-red'
              }`}
            />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-console-text">
              {isBanned ? 'LOCKED' : isSimulatedStream ? 'Test Feed' : 'Candidate Cam'}
            </span>
          </div>
          <span className="text-console-border text-[10px]">•</span>
          <div className="flex items-center gap-1 text-[9px] font-mono text-bridge-teal font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>AI Proctor</span>
          </div>
        </div>

        {/* Real-Time Strike Indicators */}
        <div className="flex items-center gap-1.5">
          {/* Eye Strikes Badge */}
          <div
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 ${
              eyeStrikes >= 3
                ? 'bg-status-red/20 text-status-red border-status-red/50 animate-pulse'
                : eyeStrikes > 0
                ? 'bg-industry-amber/20 text-industry-amber border-industry-amber/40'
                : 'bg-console-panel text-console-text-muted border-console-border'
            }`}
            title={`Eye movement violations: ${eyeStrikes}/3 (Ban on 4th)`}
          >
            <Eye className="w-2.5 h-2.5" />
            <span>Eyes: {eyeStrikes}/3</span>
          </div>

          {/* Noise Strikes Badge */}
          <div
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border flex items-center gap-1 ${
              noiseStrikes >= 3
                ? 'bg-status-red/20 text-status-red border-status-red/50 animate-pulse'
                : noiseStrikes > 0
                ? 'bg-industry-amber/20 text-industry-amber border-industry-amber/40'
                : 'bg-console-panel text-console-text-muted border-console-border'
            }`}
            title={`Background noise violations: ${noiseStrikes}/3 (Ban on 4th)`}
          >
            <Volume2 className="w-2.5 h-2.5" />
            <span>Noise: {noiseStrikes}/3</span>
          </div>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
        {/* Real Video Stream Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${
            isCameraActive && !isSimulatedStream && !isBanned ? 'block' : 'hidden'
          }`}
        />

        {/* Virtual Simulated Canvas Stream Element */}
        <canvas
          ref={canvasRef}
          width={320}
          height={240}
          className={`w-full h-full object-cover ${
            isCameraActive && isSimulatedStream && !isBanned ? 'block' : 'hidden'
          }`}
        />

        {/* Full 3-Day Ban Overlay inside Camera */}
        {isBanned && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 text-center space-y-3 z-30 animate-in fade-in">
            <div className="w-12 h-12 rounded-2xl bg-status-red/20 border-2 border-status-red/60 flex items-center justify-center text-status-red shadow-lg shadow-status-red/20 animate-bounce">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-xs font-mono font-bold text-status-red uppercase tracking-wider">
                3-Day Integrity Ban Active
              </div>
              <h4 className="font-bold text-sm text-white">
                Mock Interviews & DSA Locked
              </h4>
              <p className="text-[10px] text-console-text-muted max-w-xs leading-relaxed">
                {banDetails?.reason || 'Multiple eye deviation or background noise violations detected (>3 times).'}
              </p>
            </div>
            <div className="px-3 py-1 rounded-full bg-console-panel border border-status-red/40 text-[10px] font-mono text-status-red flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              <span>Duration: 72 Hours (3 Days)</span>
            </div>
          </div>
        )}

        {/* Inactive / Camera Error Fallback */}
        {!isCameraActive && !isBanned && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center space-y-2 bg-console-panel/95">
            <div className="w-9 h-9 rounded-xl bg-status-red/15 border border-status-red/30 flex items-center justify-center text-status-red">
              <CameraOff className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 max-w-[220px]">
              <div className="font-bold text-[11px] text-console-text">Camera Feed Inactive</div>
              <p className="text-[9px] text-console-text-muted leading-relaxed line-clamp-2">
                {cameraError || 'Camera is turned off. Start feed for live proctoring.'}
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={startWebcam}
                className="px-2.5 py-1 rounded-md bg-bridge-teal hover:bg-bridge-teal/90 text-white font-bold text-[10px] shadow-sm transition-all flex items-center gap-1"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Retry</span>
              </button>
              <button
                type="button"
                onClick={startSimulatedFeed}
                className="px-2.5 py-1 rounded-md bg-console-bg border border-console-border hover:border-bridge-teal text-console-text text-[10px] font-semibold transition-all flex items-center gap-1"
              >
                <Sparkles className="w-2.5 h-2.5 text-bridge-teal" />
                <span>Test Mode</span>
              </button>
            </div>
          </div>
        )}

        {/* Real-time Proctor Reticle & Tracking HUD */}
        {isCameraActive && !isBanned && (
          <>
            {/* Corner Brackets */}
            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-bridge-teal/60 pointer-events-none" />
            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-bridge-teal/60 pointer-events-none" />
            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-bridge-teal/60 pointer-events-none" />
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-bridge-teal/60 pointer-events-none" />

            {/* Top Status Indicators */}
            <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none px-0.5">
              {/* Eye Tracking Status */}
              <div
                className={`px-1.5 py-0.5 rounded-full backdrop-blur-sm border text-[8px] font-mono flex items-center gap-1 ${
                  isGazeCentered
                    ? 'bg-black/60 text-white border-white/10'
                    : 'bg-status-red/90 text-white border-status-red animate-pulse'
                }`}
              >
                {isGazeCentered ? <Eye className="w-2 h-2 text-bridge-teal" /> : <EyeOff className="w-2 h-2 text-white" />}
                <span>{isGazeCentered ? 'Gaze Centered' : 'Look at Screen!'}</span>
              </div>

              {/* Noise Level Meter Pill */}
              <div
                className={`px-1.5 py-0.5 rounded-full backdrop-blur-sm border text-[8px] font-mono font-bold flex items-center gap-1 ${
                  isNoiseHigh
                    ? 'bg-status-red/90 text-white border-status-red animate-pulse'
                    : 'bg-black/60 text-status-green border-white/10'
                }`}
              >
                {isNoiseHigh ? <VolumeX className="w-2 h-2 text-white" /> : <Volume2 className="w-2 h-2 text-status-green" />}
                <span>{currentDecibels} dB {isNoiseHigh ? '(High)' : ''}</span>
              </div>
            </div>

            {/* Warning Banner Overlay */}
            {activeAlert && (
              <div
                className={`absolute bottom-2 inset-x-2 p-2 rounded-xl backdrop-blur-md text-white text-[10px] font-bold flex items-start gap-2 shadow-2xl border animate-in slide-in-from-bottom-2 ${
                  activeAlert.type === 'BAN'
                    ? 'bg-status-red/95 border-status-red'
                    : activeAlert.strikeNumber === 3
                    ? 'bg-status-red/90 border-status-red animate-pulse'
                    : 'bg-industry-amber/95 border-industry-amber text-black'
                }`}
              >
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="uppercase tracking-wide text-[9px] font-mono font-extrabold opacity-90">
                    {activeAlert.type === 'BAN'
                      ? '3-Day Lockout'
                      : activeAlert.strikeNumber === 3
                      ? 'Final Warning — Next Violation Bans'
                      : `Violation Warning (${activeAlert.strikeNumber}/3)`}
                  </div>
                  <div className="leading-snug mt-0.5">{activeAlert.message}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Info Strip & Audio Meter Bar */}
      <div className="px-2.5 py-1.5 bg-console-bg flex flex-col gap-1 text-[9px] font-mono text-console-text-muted border-t border-console-border">
        {/* Live Audio Decibel Meter Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] uppercase tracking-wider text-console-text-muted w-10">Noise:</span>
          <div className="flex-1 h-1.5 bg-console-panel rounded-full overflow-hidden border border-console-border">
            <div
              className={`h-full transition-all duration-150 ${
                currentDecibels >= 55
                  ? 'bg-status-red'
                  : currentDecibels >= 45
                  ? 'bg-industry-amber'
                  : 'bg-bridge-teal'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, (currentDecibels / 80) * 100))}%` }}
            />
          </div>
          <span className="text-[8px] font-mono">{currentDecibels}dB</span>
        </div>

        {/* Quick Simulation Testing Controls for Evaluator / Testing */}
        <div className="flex items-center justify-between pt-1 border-t border-console-border/40">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleTriggerViolation('EYE')}
              disabled={isBanned}
              className="px-1.5 py-0.5 rounded bg-console-panel hover:bg-console-border text-[8px] font-mono text-console-text border border-console-border disabled:opacity-40 transition-colors"
              title="Simulate looking away to test 3 warnings & 4th strike ban"
            >
              Simulate Eye Away
            </button>
            <button
              type="button"
              onClick={() => handleTriggerViolation('NOISE')}
              disabled={isBanned}
              className="px-1.5 py-0.5 rounded bg-console-panel hover:bg-console-border text-[8px] font-mono text-console-text border border-console-border disabled:opacity-40 transition-colors"
              title="Simulate background noise to test 3 warnings & 4th strike ban"
            >
              Simulate Noise
            </button>
          </div>

          <div className="text-right text-[8px] font-semibold text-bridge-teal">
            {isBanned ? (
              <span className="text-status-red font-bold">BANNED (3 DAYS)</span>
            ) : (
              <span>PROCTOR ARMED</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
