/** View registry. Every module is lazy — the shell stays tiny and each view
 *  code-splits into its own chunk. */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ViewId } from '@/core/types';

type ViewComponent = LazyExoticComponent<ComponentType<{ param?: string }>>;

export const VIEWS: Record<ViewId, { title: string; component: ViewComponent }> = {
  today: { title: 'Hoje', component: lazy(() => import('@/modules/today/TodayView')) },
  inbox: { title: 'Entrada', component: lazy(() => import('@/modules/tasks/InboxView')) },
  upcoming: { title: 'Próximos', component: lazy(() => import('@/modules/tasks/UpcomingView')) },
  projects: { title: 'Projetos', component: lazy(() => import('@/modules/projects/ProjectsView')) },
  project: { title: 'Projeto', component: lazy(() => import('@/modules/projects/ProjectBoard')) },
  calendar: { title: 'Calendário', component: lazy(() => import('@/modules/calendar/CalendarView')) },
  focus: { title: 'Foco', component: lazy(() => import('@/modules/focus/FocusView')) },
  habits: { title: 'Hábitos', component: lazy(() => import('@/modules/habits/HabitsView')) },
  goals: { title: 'Metas', component: lazy(() => import('@/modules/goals/GoalsView')) },
  areas: { title: 'Áreas da Vida', component: lazy(() => import('@/modules/areas/AreasView')) },
  notes: { title: 'Notas', component: lazy(() => import('@/modules/notes/NotesView')) },
  finance: { title: 'Finanças', component: lazy(() => import('@/modules/finance/FinanceView')) },
  reviews: { title: 'Revisões', component: lazy(() => import('@/modules/reviews/ReviewsView')) },
  dashboard: { title: 'Painel', component: lazy(() => import('@/modules/dashboard/DashboardView')) },
  matrix: { title: 'Matriz de Eisenhower', component: lazy(() => import('@/modules/matrix/MatrixView')) },
  timeline: { title: 'Linha do Tempo', component: lazy(() => import('@/modules/timeline/TimelineView')) },
  settings: { title: 'Ajustes', component: lazy(() => import('@/modules/settings/SettingsView')) },
};
