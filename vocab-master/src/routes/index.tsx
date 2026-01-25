import { createBrowserRouter } from 'react-router-dom';
import { AuthPage } from '../components/auth';
import { Dashboard } from '../components/dashboard';
import { StudyMode } from '../components/study';
import { QuizMode } from '../components/quiz';
import { DailyChallenge } from '../components/challenge';
import { ParentDashboard } from '../components/parent';
import { AdminPanel } from '../components/admin';
import { RootLayout } from '../layouts/RootLayout';
import { ProtectedRoute, RoleRoute } from '../components/routing';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
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
            element: <Dashboard />,
          },
          {
            element: <RoleRoute allowedRoles={['student']} />,
            children: [
              {
                path: 'study',
                element: <StudyMode />,
              },
              {
                path: 'quiz',
                element: <QuizMode />,
              },
              {
                path: 'challenge',
                element: <DailyChallenge />,
              },
            ],
          },
          {
            path: 'parent',
            element: <RoleRoute allowedRoles={['parent']} />,
            children: [
              {
                index: true,
                element: <ParentDashboard />,
              },
            ],
          },
          {
            path: 'admin',
            element: <RoleRoute allowedRoles={['admin']} />,
            children: [
              {
                index: true,
                element: <AdminPanel />,
              },
            ],
          },
        ],
      },
    ],
  },
]);
