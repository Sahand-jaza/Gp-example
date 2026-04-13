import useFocusMonitor, { type Emotion } from '../../hooks/useFocusMonitor';
import { Eye, EyeOff, Wifi, WifiOff } from 'lucide-react';

const EMOTION_CONFIG: Record<Emotion, { label: string; emoji: string; color: string; bg: string }> = {
  neutral:   { label: 'Focused',    emoji: '😐', color: '#2563eb', bg: '#dbeafe' },
  happy:     { label: 'Happy',      emoji: '😊', color: '#16a34a', bg: '#dcfce7' },
  surprised: { label: 'Surprised',  emoji: '😮', color: '#d97706', bg: '#fef3c7' },
  sad:       { label: 'Sad',        emoji: '😢', color: '#7c3aed', bg: '#ede9fe' },
  angry:     { label: 'Angry',      emoji: '😠', color: '#dc2626', bg: '#fee2e2' },
  fearful:   { label: 'Anxious',    emoji: '😨', color: '#ea580c', bg: '#ffedd5' },
  disgusted: { label: 'Distracted', emoji: '😒', color: '#65a30d', bg: '#ecfccb' },
  absent:    { label: 'Away',       emoji: '📵', color: '#6b7280', bg: '#f3f4f6' },
};

function FocusRing({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  const color =
    score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
      <circle
        cx="30" cy="30" r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1s ease' }}
      />
    </svg>
  );
}

interface Props {
  studentId: string;
  activeVideoId?: string;
}

export default function FocusMonitor({ studentId, activeVideoId }: Props) {
  const { state, videoRef } = useFocusMonitor({ studentId, activeVideoId });

  const emotion = EMOTION_CONFIG[state.emotion] ?? EMOTION_CONFIG.absent;
  const statusColor = state.faceDetected ? '#22c55e' : '#ef4444';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 240,
        background: 'rgba(15,23,42,0.92)',
        backdropFilter: 'blur(16px)',
        borderRadius: 20,
        padding: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        color: 'white',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#94a3b8' }}>
            Focus Monitor
          </span>
        </div>
        {state.isConnected
          ? <Wifi size={12} color="#22c55e" />
          : <WifiOff size={12} color="#ef4444" />
        }
      </div>

      {/* Camera feed */}
      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 12, background: '#1e293b' }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: 120,
            objectFit: 'cover',
            transform: 'scaleX(-1)', // mirror
            display: 'block',
          }}
        />
        {/* Overlay when no face */}
        {!state.faceDetected && state.cameraReady && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.7)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
            <EyeOff size={24} color="#64748b" />
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
              {state.error ?? 'No face detected'}
            </span>
          </div>
        )}
        {!state.cameraReady && (
          <div style={{
            position: 'absolute', inset: 0, background: '#0f1729',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {state.error ? (
              <>
                <EyeOff size={24} color="#ef4444" />
                <span style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', padding: '0 8px' }}>{state.error}</span>
              </>
            ) : (
              <>
                <div style={{ width: 20, height: 20, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  {state.modelsLoaded ? 'Starting camera…' : 'Loading AI…'}
                </span>
              </>
            )}
          </div>
        )}

        {/* Face detected indicator */}
        {state.faceDetected && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
            borderRadius: 8, padding: '2px 6px',
          }}>
            <Eye size={10} color="#22c55e" />
          </div>
        )}
      </div>

      {/* Focus score ring + emotion */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <FocusRing score={state.focusScore} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column',
          }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{state.focusScore}</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Focus Score</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: emotion.bg, borderRadius: 8, paddingLeft: 6, paddingRight: 8,
            paddingTop: 3, paddingBottom: 3,
          }}>
            <span style={{ fontSize: 14 }}>{emotion.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: emotion.color }}>{emotion.label}</span>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{ marginTop: 10, height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${state.focusScore}%`,
          background: state.focusScore >= 70 ? '#22c55e' : state.focusScore >= 40 ? '#f59e0b' : '#ef4444',
          borderRadius: 2,
          transition: 'width 1s ease, background 1s ease',
        }} />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
