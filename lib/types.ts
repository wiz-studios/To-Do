export interface Task {
  id: string
  title: string
  completed: boolean
  createdAt: string
  priority?: "high" | "medium" | "low"
  dueDate?: string
  recurring?: "daily" | "weekly" | "monthly"
  notes?: string
  additionalNotes?: string[] // New field for additional notes
  attachments?: Array<{ name: string; data: string }>
}

export enum ActionType {
  ADD = "add",
  UPDATE = "update",
  DELETE = "delete",
  REORDER = "reorder",
  IMPORT = "import",
}

export interface TaskAction {
  type: ActionType
  task?: Task
  updatedTask?: Task
  fromIndex?: number
  toIndex?: number
  tasks?: Task[]
  importedTasks?: Task[]
  previousTasks?: Task[]
}

