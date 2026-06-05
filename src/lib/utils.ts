import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('pt-BR')
}

export function formatTime(hours: number) {
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
}

export function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    'P1': 'text-red-500',
    'P2': 'text-orange-500',
    'P3': 'text-yellow-500',
    'P4': 'text-green-500',
  }
  return colors[priority] || 'text-gray-500'
}

export function getPriorityBgColor(priority: string) {
  const colors: Record<string, string> = {
    'P1': 'bg-red-500/10',
    'P2': 'bg-orange-500/10',
    'P3': 'bg-yellow-500/10',
    'P4': 'bg-green-500/10',
  }
  return colors[priority] || 'bg-gray-500/10'
}

export function getSeverityColor(severity: string) {
  const colors: Record<string, string> = {
    'Critical': 'text-red-500',
    'High': 'text-orange-500',
    'Medium': 'text-yellow-500',
    'Low': 'text-green-500',
  }
  return colors[severity] || 'text-gray-500'
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'Backlog': 'bg-slate-500/10 text-slate-300',
    'Ready': 'bg-blue-500/10 text-blue-300',
    'In Progress': 'bg-cyan-500/10 text-cyan-300',
    'Blocked': 'bg-red-500/10 text-red-300',
    'Waiting Client': 'bg-purple-500/10 text-purple-300',
    'In Review': 'bg-orange-500/10 text-orange-300',
    'Done': 'bg-green-500/10 text-green-300',
    'Cancelled': 'bg-gray-500/10 text-gray-300',
  }
  return colors[status] || 'bg-gray-500/10 text-gray-300'
}
