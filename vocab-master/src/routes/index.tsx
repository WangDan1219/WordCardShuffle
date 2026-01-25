import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { RootLayout } from '../layouts/RootLayout';
import { ProtectedRoute, RoleRoute } from '../components/routing';

// Lazy load route components (using named exports)
const AuthPage = lazy(() => import('../components/auth/AuthPage').then(m => ({ default: m.AuthPage })));
const Dashboard = lazy(() => import('../components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const StudyMode = lazy(() => import('../components/study/StudyMode').then(m => ({ default: m.StudyMode })));
const QuizMode = lazy(() => import('../components/quiz/QuizMode').then(m => ({ default: m.QuizMode })));
const DailyChallenge = lazy(() => import('../components/challenge/DailyChallenge').then(m => ({ default: m.DailyChallenge })));
const ParentDashboard = lazy(() => import('../components/parent/ParentDashboard').then(m => ({ default: m.ParentDashboard })));
const AdminPanel = lazy(() => import('../components/admin/AdminPanel').then(m => ({ default: m.AdminPanel })));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// Wrap component with Suspense
function withSuspense(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(AuthPage),
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: withSuspense(Dashboard),
          },
          {
            element: <RoleRoute allowedRoles={['student']} />,
            children: [
              {
                path: 'study',
                element: withSuspense(StudyMode),
              },
              {
                path: 'quiz',
                element: withSuspense(QuizMode),
              },
              {
                path: 'challenge',
                element: withSuspense(DailyChallenge),
              },
            ],
          },
          {
            path: 'parent',
            element: <RoleRoute allowedRoles={['parent']} />,
            children: [
              {
                index: true,
                element: withSuspense(ParentDashboard),
              },
            ],
          },
          {
            path: 'admin',
            element: <RoleRoute allowedRoles={['admin']} />,
            children: [
              {
                index: true,
                element: withSuspense(AdminPanel),
              },
            ],
          },
        ],
      },
    ],
  },
]);
