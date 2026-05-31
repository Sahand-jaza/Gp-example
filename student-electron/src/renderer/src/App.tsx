import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp, useOrganization, useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import StudentDashboard from './components/dashboard/StudentDashboard'
import CourseView from './components/course/CourseView'
import QuizView from './components/quiz/QuizView'
import FocusMonitor from './components/monitoring/FocusMonitor'

import { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react'
import axios from 'axios'

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'red', background: 'white', minHeight: '100vh' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 10 }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function HelloUser({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useOrganization();
  const { getToken, userId } = useAuth();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    const syncUser = async () => {
      if (userId) {
        try {
          const token = await getToken();
          await axios.post('http://localhost:5000/api/student/sync', {}, {
             headers: { Authorization: `Bearer ${token}` }
          });
          console.log("User synced with MongoDB");
        } catch (error) {
          console.error("Sync failed:", error);
        } finally {
          setIsSynced(true);
        }
      }
    };
    
    syncUser();
  }, [userId, getToken]);

  if (!isLoaded || !isSynced) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full">
      {children}
      {/* Global Focus Monitoring - active on all pages */}
      {userId && <FocusMonitor studentId={userId} getToken={getToken} />}
    </div>
  )
}

function App(): JSX.Element {

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route
          path="/sign-in/*"
          element={
            <div className="flex items-center justify-center h-screen">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="flex items-center justify-center h-screen">
              <SignUp routing="path" path="/sign-up" unsafeMetadata={{ role: 'student' }} />
            </div>
          }
        />
        <Route
          path="/sso-callback"
          element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl="/" signInForceRedirectUrl="/" />}
        />
        <Route
          path="/"
          element={
            <>
              <SignedIn>
                <HelloUser>
                  <StudentDashboard />
                </HelloUser>
              </SignedIn>
              <SignedOut>
                <div className="flex items-center justify-center h-screen bg-gray-50">
                  <div className="w-full max-w-md">
                    <SignIn />
                  </div>
                </div>
              </SignedOut>
            </>
          }
        />
        <Route
          path="/course/:courseId"
          element={
            <>
              <SignedIn>
                <HelloUser>
                  <CourseView />
                </HelloUser>
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" />
              </SignedOut>
            </>
          }
        />
        <Route
          path="/course/:courseId/quiz/:videoId"
          element={
            <>
              <SignedIn>
                <HelloUser>
                  <QuizView />
                </HelloUser>
              </SignedIn>
              <SignedOut>
                <Navigate to="/sign-in" />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </div>
    </ErrorBoundary>
  )
}

export default App
