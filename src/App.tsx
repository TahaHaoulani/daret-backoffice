import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthContext';
import { ThemeProvider } from './app/theme/ThemeContext';
import { I18nProvider } from './app/i18n/I18nContext';
import { MainLayout } from './app/layout/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './features/auth/LoginPage';
import { MfaSetupPage } from './features/mfa/MfaSetupPage';
import { MfaVerifyPage } from './features/mfa/MfaVerifyPage';
import { SecuritySettingsPage } from './features/settings/SecuritySettingsPage';
import { ReferenceDataPage } from './features/settings/ReferenceDataPage';
import { ReferenceDomainDetailPage } from './features/settings/ReferenceDomainDetailPage';
import { UsersSearchPage } from './features/users/pages/UsersSearchPage';
import { UserWorkspacePage } from './features/users/pages/UserWorkspacePage';
import { GrantingQueuePage } from './features/granting/pages/GrantingQueuePage';
import { SubmissionDetailPage } from './features/kyc/SubmissionDetailPage';
import { AuditPage } from './features/audit/AuditPage';
import { CronsPage } from './features/crons/CronsPage';
import { CirclesListPage } from './features/circles/pages/CirclesListPage';
import { CreatePublicCirclePage } from './features/circles/pages/CreatePublicCirclePage';
import { CircleDetailPage } from './features/circles/pages/CircleDetailPage';
import { ScoringPage } from './features/scoring/ScoringPage';
import { ScoringModelDetailPage } from './features/scoring/ScoringModelDetailPage';
import { RecouvrementPage } from './features/recouvrement/pages/RecouvrementPage';
import { BridgeVerificationSuccessPage, BridgeVerificationErrorPage } from './features/bridge/pages/BridgeVerificationResultPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30 * 1000 },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mfa/setup" element={<MfaSetupPage />} />
      <Route path="/mfa/verify" element={<MfaVerifyPage />} />
      <Route path="/bridge/verification/success" element={<BridgeVerificationSuccessPage />} />
      <Route path="/bridge/verification/error" element={<BridgeVerificationErrorPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/users" replace />
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/users" replace />} />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <MainLayout>
              <UsersSearchPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <UserWorkspacePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/granting"
        element={
          <ProtectedRoute>
            <MainLayout>
              <GrantingQueuePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/recouvrement"
        element={
          <ProtectedRoute>
            <MainLayout>
              <RecouvrementPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/kyc/queue" element={<Navigate to="/granting" replace />} />
      <Route
        path="/kyc/submissions/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SubmissionDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AuditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crons"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CronsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scoring"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ScoringPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/scoring/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ScoringModelDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CirclesListPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/create"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreatePublicCirclePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/circles/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CircleDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/security"
        element={
          <ProtectedRoute>
            <MainLayout>
              <SecuritySettingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/reference-data"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReferenceDataPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/reference-data/:code"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ReferenceDomainDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
