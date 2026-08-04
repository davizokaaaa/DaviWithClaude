/** View registry. Every module is lazy — the shell stays tiny and each view
 *  code-splits into its own chunk. */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ViewId } from '@/core/types';

type ViewComponent = LazyExoticComponent<ComponentType<{ param?: string }>>;

export const VIEWS: Record<ViewId, { title: string; component: ViewComponent }> = {
  today: { title: 'Today', component: lazy(() => import('@/modules/today/TodayView')) },
  inbox: { title: 'Inbox', component: lazy(() => import('@/modules/tasks/InboxView')) },
  upcoming: { title: 'Upcoming', component: lazy(() => import('@/modules/tasks/UpcomingView')) },
  projects: { title: 'Projects', component: lazy(() => import('@/modules/projects/ProjectsView')) },
  project: { title: 'Project', component: lazy(() => import('@/modules/projects/ProjectBoard')) },
  calendar: { title: 'Calendar', component: lazy(() => import('@/modules/calendar/CalendarView')) },
  focus: { title: 'Focus', component: lazy(() => import('@/modules/focus/FocusView')) },
  habits: { title: 'Habits', component: lazy(() => import('@/modules/habits/HabitsView')) },
  goals: { title: 'Goals', component: lazy(() => import('@/modules/goals/GoalsView')) },
  areas: { title: 'Life Areas', component: lazy(() => import('@/modules/areas/AreasView')) },
  notes: { title: 'Notes', component: lazy(() => import('@/modules/notes/NotesView')) },
  finance: { title: 'Finance', component: lazy(() => import('@/modules/finance/FinanceView')) },
  reviews: { title: 'Reviews', component: lazy(() => import('@/modules/reviews/ReviewsView')) },
  dashboard: { title: 'Dashboard', component: lazy(() => import('@/modules/dashboard/DashboardView')) },
  matrix: { title: 'Eisenhower Matrix', component: lazy(() => import('@/modules/matrix/MatrixView')) },
  timeline: { title: 'Timeline', component: lazy(() => import('@/modules/timeline/TimelineView')) },
  settings: { title: 'Settings', component: lazy(() => import('@/modules/settings/SettingsView')) },
};
