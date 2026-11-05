export type GoalType =
  | 'strength'
  | 'muscle'
  | 'fatloss'
  | 'endurance'
  | 'mobility'
  | 'skill'
  | 'general'

export interface Goal {
  id: string
  type: GoalType
  /** 1 = most important. Order in the profile list is the ranking. */
  target?: string
}

export type Equip =
  | 'gym'
  | 'dumbbell'
  | 'bodyweight'
  | 'bands'
  | 'kettlebell'
  | 'cardio-machine'
  | 'none'

export type Level = 'beginner' | 'intermediate' | 'advanced'
export type Units = 'lb' | 'kg'

export interface Profile {
  goals: Goal[] // ranked, index 0 = top priority
  level: Level
  equipment: Equip[]
  daysPerWeek: number
  minutes: number
  units: Units
  limits: string
  createdAt: string
}

export type Kind = 'lift' | 'bodyweight' | 'core' | 'cardio' | 'mobility'

export interface Exercise {
  id: string
  name: string
  kind: Kind
  pattern: string
  equip: Equip
  level: string
  muscles: string[]
  instructions: string[]
  frames: string[]
  /** demo photos borrowed from a similar move, not an exact match */
  custom?: boolean
}

/** What the target number means for this exercise. */
export type TargetUnit = 'reps' | 'sec' | 'min'

export interface PlanExercise {
  exerciseId: string
  sets: number
  /** target reps, hold seconds, or minutes depending on unit */
  target: number
  unit: TargetUnit
  restSec: number
  /** Base working weight. null = not calibrated yet (first session) or no load. */
  weight: number | null
  /** consecutive sessions where the target was missed */
  missStreak: number
  note?: string
}

export interface PlanDay {
  id: string
  label: string
  focus: string
  optional?: boolean
  /** suggested weekday, e.g. 'Mon' */
  when?: string
  exercises: PlanExercise[]
}

export interface Program {
  id: string
  createdAt: string
  /** 1-based training week. Every 4th week is a deload. */
  week: number
  /** how many days of the current cycle have been finished */
  cycleDone: number
  days: PlanDay[]
  /** things you do outside the app that shape the week */
  outside?: { when: string; label: string }[]
  notes: string[]
}

export interface SetLog {
  exerciseId: string
  setIndex: number
  /** prescribed target at the time (reps/sec/min) */
  target: number
  /** what the user actually did */
  actual: number
  weight: number | null
  done: boolean
}

export type Feedback = 'easy' | 'ok' | 'hard'

export interface Session {
  id: string
  date: string // ISO
  dayId: string
  dayLabel: string
  week: number
  sets: SetLog[]
  feedback?: Feedback
  finished: boolean
}

export interface BodyweightEntry {
  date: string
  value: number
}
