import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  SafeAreaView, ScrollView, RefreshControl
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useApi } from '../lib/api';

interface Student {
  studentId: string;
  name: string;
  email: string;
  linkedAt: string;
}

interface QuizScore {
  videoTitle: string;
  score: number;
  passed: boolean;
  date: string;
}

interface StudentStats {
  totalCourses: number;
  totalVideosPassed: number;
  totalVideosWatched: number;
  avgScore: number;
  recentScores: QuizScore[];
}

interface LiveStatus {
  focus: number;
  emotion: string;
  isTabbedOut: boolean;
  videoId: string | null;
  lastSeen: Date;
}

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:5000';

const EMOTION_MAP: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  neutral:   { emoji: '😐', label: 'Focused',    color: '#2563eb', bg: '#dbeafe' },
  happy:     { emoji: '😊', label: 'Happy',      color: '#16a34a', bg: '#dcfce7' },
  surprised: { emoji: '😮', label: 'Surprised',  color: '#d97706', bg: '#fef3c7' },
  sad:       { emoji: '😢', label: 'Sad',        color: '#7c3aed', bg: '#ede9fe' },
  angry:     { emoji: '😠', label: 'Angry',      color: '#dc2626', bg: '#fee2e2' },
  fearful:   { emoji: '😨', label: 'Anxious',    color: '#ea580c', bg: '#ffedd5' },
  disgusted: { emoji: '😒', label: 'Distracted', color: '#65a30d', bg: '#ecfccb' },
  absent:    { emoji: '📵', label: 'Away',       color: '#6b7280', bg: '#f3f4f6' },
};

function FocusBar({ score }: { score: number }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <View style={{ height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
      <View style={{ width: `${score}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const api = useApi();
  
  const [connectionCode, setConnectionCode] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, LiveStatus>>({});
  const [studentStats, setStudentStats] = useState<Record<string, StudentStats>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  
  const wsRefs = useRef<Record<string, WebSocket>>({});

  const fetchStudentStats = async (studentId: string) => {
    try {
      const response = await api.get(`/parents/students/${studentId}/stats`);
      if (response.data.success) {
        setStudentStats(prev => ({
          ...prev,
          [studentId]: response.data.stats
        }));
      }
    } catch (error) {
      // Silent error
    }
  };

  const fetchProfile = useCallback(async () => {
    console.log('[DEBUG] Fetching Parent Profile...');
    setCodeError(null);
    try {
      const response = await api.get('/parents/profile');
      console.log('[DEBUG] Parent Profile Response:', response.data);
      if (response.data.success) {
        setConnectionCode(response.data.profile.connectionCode);
      }
    } catch (error: any) {
      console.error('[DEBUG] Fetch Profile Error:', error.response?.data || error.message);
      const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Connection Error';
      setCodeError(msg);
    } finally {
      setLoading(false);
    }
  }, []); // Exclude api to prevent infinite fetch loop

  const fetchStudents = useCallback(async () => {
    console.log('[DEBUG] Fetching Connected Students...');
    try {
      const response = await api.get('/parents/students');
      console.log('[DEBUG] Connected Students Response:', response.data);
      if (response.data.success) {
        setStudents(response.data.students);
        for (const s of response.data.students) {
          await fetchStudentStats(s.studentId);
        }
      }
    } catch (error: any) {
       console.error('[DEBUG] Fetch Students Error:', error.response?.data || error.message);
    } finally {
      setStudentsLoading(false);
    }
  }, []); // Exclude api to prevent infinite fetch loop

  // Subscribe to each student's WebSocket room
  const subscribeToStudent = useCallback((studentId: string) => {
    if (wsRefs.current[studentId]) return;

    const ws = new WebSocket(WS_URL);
    wsRefs.current[studentId] = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'JOIN_ROOM', studentId }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'UPDATE') {
          setLiveStatus(prev => ({
            ...prev,
            [studentId]: {
              focus: data.focus ?? 0,
              emotion: data.emotion ?? 'absent',
              isTabbedOut: !!data.isTabbedOut,
              videoId: data.videoId ?? null,
              lastSeen: new Date(),
            },
          }));
        }
      } catch (e) { /* ignore */ }
    };

    ws.onclose = () => {
      delete wsRefs.current[studentId];
      setTimeout(() => subscribeToStudent(studentId), 5000);
    };

    ws.onerror = () => ws.close();
  }, []);

  useEffect(() => {
    students.forEach(s => subscribeToStudent(s.studentId));
  }, [students, subscribeToStudent]);

  useEffect(() => {
    return () => {
      Object.values(wsRefs.current).forEach(ws => ws.close());
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStudents();
      const interval = setInterval(fetchStudents, 15000);
      return () => clearInterval(interval);
    }
  }, [user, fetchProfile, fetchStudents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchStudents()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{
        backgroundColor: 'white', paddingHorizontal: 24, paddingBottom: 20,
        paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <View>
          <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
            Parent Portal
          </Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
            Hello, {user?.firstName || 'Parent'}
          </Text>
        </View>
        <TouchableOpacity
          style={{
            width: 40, height: 40, backgroundColor: '#f8fafc', borderRadius: 20,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#f1f5f9'
          }}
          onPress={() => signOut()}
        >
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Connection Code Card */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 24, padding: 24,
          marginBottom: 32, shadowColor: '#0f172a', shadowOpacity: 0.25,
          shadowRadius: 20, elevation: 8
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{
              width: 32, height: 32, backgroundColor: 'rgba(59,130,246,0.2)',
              borderRadius: 16, alignItems: 'center', justifyContent: 'center'
            }}>
              <Ionicons name="key" size={16} color="#3b82f6" />
            </View>
            <Text style={{ color: '#94a3b8', fontWeight: '700', marginLeft: 10, fontSize: 14 }}>
              Parent Connection Key
            </Text>
          </View>
          <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 12 }}>
            Give this code to your student to sync accounts:
          </Text>
          <View style={{
            backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, paddingVertical: 24,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
          }}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : codeError ? (
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{codeError}</Text>
            ) : (
              <Text style={{ fontSize: 36, fontWeight: '800', color: 'white', letterSpacing: 6 }}>
                {connectionCode || '---'}
              </Text>
            )}
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, opacity: 0.7 }}>
            <Ionicons name="copy-outline" size={14} color="white" />
            <Text style={{ color: 'white', fontSize: 12, marginLeft: 8, fontWeight: '500' }}>Tap to copy code</Text>
          </TouchableOpacity>
        </View>

        {/* Connected Students */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Connected Students</Text>
          <View style={{
            backgroundColor: students.length > 0 ? '#dbeafe' : '#f1f5f9',
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
          }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: students.length > 0 ? '#2563eb' : '#94a3b8' }}>
              {students.length} linked
            </Text>
          </View>
        </View>

        {studentsLoading ? (
          <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#3b82f6" />
            <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 14 }}>Loading students...</Text>
          </View>
        ) : students.length === 0 ? (
          <View style={{
            backgroundColor: 'white', borderRadius: 24, padding: 40, alignItems: 'center',
            borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed'
          }}>
            <View style={{
              width: 64, height: 64, backgroundColor: '#f8fafc',
              borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16
            }}>
              <Ionicons name="people-outline" size={32} color="#cbd5e1" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>No students linked yet</Text>
            <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 22, fontSize: 14 }}>
              Share your key above. The list updates automatically when a student connects.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {students.map((student) => {
              const live = liveStatus[student.studentId];
              const isLive = !!live && (new Date().getTime() - live.lastSeen.getTime()) < 30000;
              const emotion = live ? (EMOTION_MAP[live.emotion] ?? EMOTION_MAP.absent) : null;
              const focusScore = live?.focus ?? 0;
              const focusColor = focusScore >= 70 ? '#22c55e' : focusScore >= 40 ? '#f59e0b' : '#ef4444';

              return (
                <View
                  key={student.studentId}
                  style={{
                    backgroundColor: 'white', borderRadius: 20, padding: 20,
                    borderWidth: 1, borderColor: isLive ? '#dbeafe' : '#f1f5f9',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, elevation: 3
                  }}
                >
                  {/* Top Row: avatar + name + online badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 48, height: 48, borderRadius: 24, backgroundColor: '#dbeafe',
                      alignItems: 'center', justifyContent: 'center', marginRight: 14
                    }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#2563eb' }}>
                        {student.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>{student.name}</Text>
                      <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{student.email}</Text>
                    </View>
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6
                    }}>
                      {/* App Switch Warning */}
                      {isLive && live.isTabbedOut && (
                        <View style={{
                          backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
                          flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#fca5a5'
                        }}>
                          <Ionicons name="warning-outline" size={12} color="#ef4444" />
                          <Text style={{ fontSize: 10, fontWeight: '800', color: '#ef4444' }}>SWITCHED APP</Text>
                        </View>
                      )}

                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                        backgroundColor: isLive ? '#dcfce7' : '#f1f5f9',
                        paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12
                      }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isLive ? '#22c55e' : '#94a3b8' }} />
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isLive ? '#16a34a' : '#94a3b8' }}>
                          {isLive ? 'Live' : 'Offline'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Live monitoring data */}
                  {isLive && emotion && (
                    <View style={{ marginTop: 16 }}>
                      {/* Focus score row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>Focus Score</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          {/* Emotion badge */}
                          <View style={{ backgroundColor: emotion.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 13 }}>{emotion.emoji}</Text>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: emotion.color }}>{emotion.label}</Text>
                          </View>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: focusColor }}>{focusScore}%</Text>
                        </View>
                      </View>
                      <FocusBar score={focusScore} />

                      {live.videoId && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 }}>
                          <Ionicons name="play-circle-outline" size={14} color="#94a3b8" />
                          <Text style={{ fontSize: 12, color: '#94a3b8' }}>Watching a video</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {!isLive && (
                    <Text style={{ fontSize: 12, color: '#cbd5e1', marginTop: 12, fontStyle: 'italic' }}>
                      Open the Student App to see live focus data
                    </Text>
                  )}

                  {/* Progress Statistics */}
                  {studentStats[student.studentId] && (
                    <View style={{ marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                            {studentStats[student.studentId].totalCourses}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>
                            Courses
                          </Text>
                        </View>
                        <View style={{ width: 1, height: '100%', backgroundColor: '#f1f5f9' }} />
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                            {studentStats[student.studentId].totalVideosWatched}
                          </Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>
                            Videos
                          </Text>
                        </View>
                        <View style={{ width: 1, height: '100%', backgroundColor: '#f1f5f9' }} />
                        <View style={{ alignItems: 'center', flex: 1 }}>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: '#2563eb' }}>
                            {studentStats[student.studentId].avgScore}%
                          </Text>
                          <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 }}>
                            Quiz Avg
                          </Text>
                        </View>
                      </View>

                      {/* Expandable Report Section */}
                      <TouchableOpacity 
                        onPress={() => setExpandedStudent(expandedStudent === student.studentId ? null : student.studentId)}
                        style={{ 
                          backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, 
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6
                        }}
                      >
                        <Ionicons 
                          name={expandedStudent === student.studentId ? "chevron-up" : "document-text-outline"} 
                          size={16} color="#64748b" 
                        />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>
                          {expandedStudent === student.studentId ? "Hide Report" : "View Recent Scores"}
                        </Text>
                      </TouchableOpacity>

                      {expandedStudent === student.studentId && (
                        <View style={{ marginTop: 12, gap: 8 }}>
                          {studentStats[student.studentId].recentScores.length === 0 ? (
                            <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: 10 }}>No quiz scores yet</Text>
                          ) : (
                            studentStats[student.studentId].recentScores.map((score, idx) => (
                              <View key={idx} style={{ 
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                backgroundColor: '#fdfdfd', padding: 10, borderRadius: 10,
                                borderWidth: 1, borderColor: '#f1f5f9'
                              }}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b' }} numberOfLines={1}>
                                    {score.videoTitle}
                                  </Text>
                                  <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                                    {new Date(score.date).toLocaleDateString()}
                                  </Text>
                                </View>
                                <View style={{ 
                                  backgroundColor: score.passed ? '#dcfce7' : '#fee2e2',
                                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8
                                }}>
                                  <Text style={{ fontSize: 12, fontWeight: '800', color: score.passed ? '#16a34a' : '#ef4444' }}>
                                    {score.score}%
                                  </Text>
                                </View>
                              </View>
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={{ marginTop: 20, padding: 10, alignItems: 'center', opacity: 0.3 }}>
          <Text style={{ fontSize: 10, color: '#94a3b8' }}>API: {api.defaults.baseURL}</Text>
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
