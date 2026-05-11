import { useEffect, useRef, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
const HEARTBEAT_INTERVAL_MS = 5000;

export type Emotion =
  | 'neutral' | 'happy' | 'sad' | 'angry'
  | 'fearful' | 'disgusted' | 'surprised' | 'absent';

export interface FocusState {
  isConnected: boolean;
  modelsLoaded: boolean;
  cameraReady: boolean;
  faceDetected: boolean;
  isTabbedOut: boolean;    // Track if app lost focus
  focusScore: number;      // 0 – 100
  emotion: Emotion;
  error: string | null;
}

interface Props {
  studentId: string;
  activeVideoId?: string;
  onFocusUpdate?: (state: Pick<FocusState, 'focusScore' | 'emotion' | 'faceDetected'>) => void;
}

function computeFocusScore(expressions: faceapi.FaceExpressions): number {
  const focused =
    (expressions.neutral ?? 0) * 1.0 +
    (expressions.happy ?? 0) * 0.8 +
    (expressions.surprised ?? 0) * 0.4;
  const distracted =
    (expressions.sad ?? 0) +
    (expressions.angry ?? 0) +
    (expressions.disgusted ?? 0) +
    (expressions.fearful ?? 0) * 0.5;
  return Math.round(Math.min(100, Math.max(0, (focused - distracted * 0.5) * 100)));
}

function getDominantEmotion(expressions: faceapi.FaceExpressions): Emotion {
  return (
    Object.entries(expressions).reduce((a, b) =>
      (a[1] as number) > (b[1] as number) ? a : b
    )[0] as Emotion
  );
}

export default function useFocusMonitor({ studentId, activeVideoId, onFocusUpdate }: Props): {
  state: FocusState;
  videoRef: React.RefObject<HTMLVideoElement>;
} {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef(true); // Guard against reconnect after unmount

  const [state, setState] = useState<FocusState>({
    isConnected: false,
    modelsLoaded: false,
    cameraReady: false,
    faceDetected: false,
    isTabbedOut: false,
    focusScore: 0,
    emotion: 'absent',
    error: null,
  });

  // ─── 1. Load models ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        console.log('[FocusMonitor] Loading models from:', MODELS_URL);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);
        setState(s => ({ ...s, modelsLoaded: true }));
        console.log('[FocusMonitor] Models loaded successfully');
      } catch (err) {
        console.error('[FocusMonitor] Model load failed:', err);
        setState(s => ({ ...s, error: `AI Load Failed: ${err instanceof Error ? err.message : 'Check connection'}` }));
      }
    })();
  }, []);

  // ─── 2. Start webcam ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setState(s => ({ ...s, cameraReady: true }));
        }
      } catch (err: any) {
        console.error('[FocusMonitor] Camera error:', err);
        setState(s => ({ ...s, error: 'Camera access denied' }));
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // ─── 3. WebSocket ─────────────────────────────────────────────────────────
  const sendHeartbeat = useCallback(
    (focus: number, emotion: Emotion) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'HEARTBEAT',
            studentId,
            focus,
            emotion,
            isTabbedOut: state.isTabbedOut,
            videoId: activeVideoId ?? null,
          })
        );
      }
    },
    [studentId, activeVideoId, state.isTabbedOut]
  );

  // ─── 4. Window focus detection ───────────────────────────────────────────
  useEffect(() => {
    const handleBlur = () => setState(s => ({ ...s, isTabbedOut: true }));
    const handleFocus = () => setState(s => ({ ...s, isTabbedOut: false }));

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    
    // Initial check
    if (!document.hasFocus()) {
      setState(s => ({ ...s, isTabbedOut: true }));
    }

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const connect = () => {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setState(s => ({ ...s, isConnected: true }));
        ws.send(JSON.stringify({ type: 'JOIN_ROOM', studentId }));
        console.log('[FocusMonitor] WS connected, joined room for', studentId);
      };
      ws.onclose = () => {
        setState(s => ({ ...s, isConnected: false }));
        // Only reconnect if the component is still mounted
        if (isMountedRef.current) {
          setTimeout(connect, 5000);
        }
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      isMountedRef.current = false;
      wsRef.current?.close();
    };
  }, [studentId]);

  // ─── 4. Detection loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!state.modelsLoaded || !state.cameraReady) return;

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.paused) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
          .withFaceExpressions();

        if (!detection) {
          const update = { faceDetected: false, focusScore: 0, emotion: 'absent' as Emotion };
          setState(s => ({ ...s, ...update }));
          onFocusUpdate?.({ ...update, faceDetected: false });
          sendHeartbeat(0, 'absent');
          return;
        }

        const score = computeFocusScore(detection.expressions);
        const emotion = getDominantEmotion(detection.expressions);
        const update = { faceDetected: true, focusScore: score, emotion };
        setState(s => ({ ...s, ...update }));
        onFocusUpdate?.({ ...update, faceDetected: true });
        sendHeartbeat(score, emotion);
      } catch (err) {
        console.error('[FocusMonitor] Detection error:', err);
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.modelsLoaded, state.cameraReady, sendHeartbeat, onFocusUpdate]);

  return { state, videoRef };
}
