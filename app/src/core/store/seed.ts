/**
 * The empty workspace.
 *
 * Meridian opens blank — the structure is yours to build. Areas, goals,
 * habits and everything else are created in-app; nothing arrives pre-filled.
 * (The original demo seed lived here; it was removed so real data could
 * take its place. `resetToSeed` now means "start from zero".)
 */

import type { DataState } from '@/core/store/data';

type SeedSlice = Omit<
  DataState,
  | 'addTask' | 'updateTask' | 'completeTask' | 'reopenTask' | 'dropTask' | 'deleteTask'
  | 'toggleSubtask' | 'addSubtask' | 'moveTaskToColumn' | 'planTask' | 'setPriority'
  | 'addProject' | 'updateProject' | 'updateKeyResult' | 'updateGoal'
  | 'addArea' | 'updateArea' | 'addGoal' | 'deleteGoal' | 'addKeyResult'
  | 'addBlock' | 'updateBlock' | 'deleteBlock'
  | 'toggleHabit' | 'freezeHabit' | 'addHabit' | 'updateHabit'
  | 'logPulse' | 'startSession' | 'endSession'
  | 'addNote' | 'updateNote' | 'deleteNote'
  | 'updateFlow' | 'addFlow' | 'deleteFlow' | 'updateSavings' | 'addSavings' | 'deleteSavings'
  | 'markDayPlanned' | 'recordShutdown' | 'saveReview' | 'carryOver' | 'resetToSeed'
>;

export function seedState(): SeedSlice {
  return {
    areas: [],
    goals: [],
    projects: [],
    tasks: [],
    blocks: [],
    habits: [],
    habitLogs: [],
    pulses: [],
    sessions: [],
    notes: [],
    flows: [],
    savings: [],
    reviews: [],
    shutdowns: [],
    plannedDays: [],
  };
}
