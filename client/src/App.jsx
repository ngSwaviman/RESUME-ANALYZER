import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import { useAuth } from './hooks/useAuth.js';
import { homeFor } from './utils/roles.js';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import CandidateRegister from './pages/CandidateRegister.jsx';
import RecruiterRegister from './pages/RecruiterRegister.jsx';
import CandidateDashboard from './pages/CandidateDashboard.jsx';
import RecruiterDashboard from './pages/RecruiterDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import ResumeUpload from './pages/ResumeUpload.jsx';
import ResumeAnalysis from './pages/ResumeAnalysis.jsx';
import JobListing from './pages/JobListing.jsx';
import JobManagement from './pages/JobManagement.jsx';
import CandidateRanking from './pages/CandidateRanking.jsx';
import JobRecommendation from './pages/JobRecommendation.jsx';
import CandidateProfile from './pages/CandidateProfile.jsx';
import NotFound from './pages/NotFound.jsx';

/** Landing page redirects logged-in users straight to their workspace. */
function LandingGate() {
  const { user } = useAuth();
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingGate />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/register/candidate" replace />} />
      <Route path="/register/candidate" element={<CandidateRegister />} />
      <Route path="/register/recruiter" element={<RecruiterRegister />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Shared */}
          <Route path="/jobs" element={<JobListing />} />

          {/* Candidate */}
          <Route element={<RoleRoute roles={['candidate']} />}>
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/upload" element={<ResumeUpload />} />
            <Route path="/candidate/analysis" element={<ResumeAnalysis />} />
            <Route path="/candidate/recommendations" element={<JobRecommendation />} />
            <Route path="/candidate/profile" element={<CandidateProfile />} />
          </Route>

          {/* Recruiter */}
          <Route element={<RoleRoute roles={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/jobs" element={<JobManagement />} />
            <Route path="/recruiter/ranking" element={<CandidateRanking />} />
          </Route>

          {/* Admin */}
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
