// Enums — valores numéricos espelham o backend (.NET)
export enum TicketType { Bug = 1, Feature = 2, Improvement = 3, TechDebt = 4 }
export enum Priority   { P1 = 1, P2 = 2, P3 = 3, P4 = 4 }
export enum Severity   { Critical = 1, High = 2, Medium = 3, Low = 4 }
export enum TicketStatus {
  Backlog = 1, Ready = 2, InProgress = 3, Blocked = 4,
  WaitingClient = 5, InReview = 6, Done = 7, Cancelled = 8
}
export enum TodoStatus { Backlog = 1, ThisWeek = 2, InProgress = 3, Waiting = 4, Done = 5 }
export enum UserRole {
  SuperAdmin = 1, TenantAdmin = 2, Manager = 3, Developer = 4, Client = 5
}
export enum Plan { Free = 1, Pro = 2, Enterprise = 3 }

// Labels para exibição
export const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.P1]: 'P1', [Priority.P2]: 'P2', [Priority.P3]: 'P3', [Priority.P4]: 'P4',
}
export const SEVERITY_LABEL: Record<Severity, string> = {
  [Severity.Critical]: 'Critical', [Severity.High]: 'High',
  [Severity.Medium]: 'Medium',     [Severity.Low]: 'Low',
}
export const STATUS_LABEL: Record<TicketStatus, string> = {
  [TicketStatus.Backlog]: 'Backlog',   [TicketStatus.Ready]: 'Ready',
  [TicketStatus.InProgress]: 'In Progress', [TicketStatus.Blocked]: 'Blocked',
  [TicketStatus.WaitingClient]: 'Waiting Client', [TicketStatus.InReview]: 'In Review',
  [TicketStatus.Done]: 'Done',         [TicketStatus.Cancelled]: 'Cancelled',
}
export const TYPE_LABEL: Record<TicketType, string> = {
  [TicketType.Bug]: 'Bug', [TicketType.Feature]: 'Feature',
  [TicketType.Improvement]: 'Improvement', [TicketType.TechDebt]: 'Tech Debt',
}
export const TODO_STATUS_LABEL: Record<TodoStatus, string> = {
  [TodoStatus.Backlog]: 'Backlog', [TodoStatus.ThisWeek]: 'This Week',
  [TodoStatus.InProgress]: 'In Progress', [TodoStatus.Waiting]: 'Waiting',
  [TodoStatus.Done]: 'Done',
}

// Domain types — espelham os DTOs do backend
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  tenantId: string
  isActive: boolean
  createdAt: string
}

export interface TicketDto {
  id: string
  title: string
  description: string
  type: TicketType
  priority: Priority
  severity: Severity
  status: TicketStatus
  projectId: string
  projectName: string
  featureId?: string
  featureName?: string
  createdByUserId: string
  createdByUserName: string
  assignedToUserId?: string
  assignedToUserName?: string
  createdAt: string
  startedAt?: string
  closedAt?: string
  estimatedHours?: number
  actualHours?: number
  justification?: string
  tags: string[]
  sprintId?: string
  sprintName?: string
}

export interface SprintDto {
  id: string
  name: string
  goal?: string
  type: number   // 1=Sprint 2=Sustentation
  status: number // 1=Planning 2=Active 3=Closed
  startDate: string
  endDate: string
  ticketCount: number
  doneCount: number
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface FeatureDto {
  id: string
  name: string
  description: string
  version: string
  projectId: string
  projectName: string
  createdAt: string
}

export interface TodoDto {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: Priority
  status: TodoStatus
  userId: string
  userName: string
  relatedTicketId?: string
  relatedTicketTitle?: string
  relatedFeatureId?: string
  relatedFeatureName?: string
  createdAt: string
}

export interface DashboardMetricsDto {
  openBugs: number
  closedBugs: number
  criticalBugs: number
  avgResolutionDays: number
  monthlyThroughput: number
  totalTickets: number
  inProgressTickets: number
  blockedTickets: number
}

export interface BugTrendPoint {
  month: string
  opened: number
  closed: number
}

export interface PriorityPoint {
  name: string
  value: number
  fill: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresAt: string
  tenantName: string
  user: User
}
