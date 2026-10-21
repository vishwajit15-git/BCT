import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Pages
import Dashboard from './pages/Dashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PatientDashboard from './pages/PatientDashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import UploadRecord from './pages/UploadRecord.jsx'
import Records from './pages/Records.jsx'
import RecordDetail from './pages/RecordDetail.jsx'
import AccessManagement from './pages/AccessManagement.jsx'
import TransactionHistory from './pages/TransactionHistory.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public routes */}
        <Route index element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Patient-protected routes */}
        <Route
          path="patient"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="upload"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <UploadRecord />
            </ProtectedRoute>
          }
        />
        <Route
          path="access"
          element={
            <ProtectedRoute allowedRoles={['patient']}>
              <AccessManagement />
            </ProtectedRoute>
          }
        />

        {/* Doctor-protected routes */}
        <Route
          path="doctor"
          element={
            <ProtectedRoute allowedRoles={['doctor']}>
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Authenticated routes (Patient or Doctor) */}
        <Route
          path="records"
          element={
            <ProtectedRoute>
              <Records />
            </ProtectedRoute>
          }
        />
        <Route
          path="records/:id"
          element={
            <ProtectedRoute>
              <RecordDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="history"
          element={
            <ProtectedRoute>
              <TransactionHistory />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
