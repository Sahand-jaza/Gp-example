import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp, useOrganization, useAuth, AuthenticateWithRedirectCallback } from '@clerk/clerk-react'
import StudentDashboard from './components/dashboard/StudentDashboard'
import CourseView from './components/course/CourseView'
import QuizView from './components/quiz/QuizView'

import { useEffect } from 'react'
import axios from 'axios'

function HelloUser({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useOrganization();
  const { getToken, userId } = useAuth();

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
        }
      }
    };
    
    syncUser();
  }, [userId, getToken]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full">
      {children}
    </div>
  )
}

function App(): JSX.Element {

  return (
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
  )
}

export default App
