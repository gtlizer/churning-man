export type ExpenseCategory =
  | 'Supplies'
  | 'Food & Drinks'
  | 'Vehicle'
  | 'Fuel'
  | 'Camp Setup'
  | 'Costumes'
  | 'Other'

export type EventCategory =
  | 'Ice Cream Run'
  | 'Camp Setup'
  | 'Party'
  | 'Meeting'
  | 'Maintenance'
  | 'Other'

export type GearCategory =
  | 'Ice Cream Equipment'
  | 'Camp Essentials'
  | 'Vehicle'
  | 'Safety'
  | 'Entertainment'
  | 'Costumes'
  | 'Food & Ingredients'
  | 'Other'

export interface Expense {
  id: string
  title: string
  description?: string
  amount: number
  category: ExpenseCategory
  paidBy: string
  date: string
  notes?: string
}

export interface ScheduleEvent {
  id: string
  title: string
  date: string
  startTime: string
  endTime?: string
  location?: string
  description?: string
  category: EventCategory
  assignedTo?: string
  theme?: string
  bits?: string
}

export interface GearItem {
  id: string
  name: string
  category: GearCategory
  quantity: number
  assignedTo?: string
  packed: boolean
  notes?: string
}

export interface IceCreamItem {
  id: string
  name: string
  quantity: number
  notes?: string
}
