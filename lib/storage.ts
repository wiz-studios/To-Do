import type { Task } from "./types"

const STORAGE_KEY = "advanced-todo-tasks"

export const saveTasksToLocalStorage = (tasks: Task[]): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }
}

export const getTasksFromLocalStorage = (): Task[] | null => {
  if (typeof window !== "undefined") {
    const tasksJson = localStorage.getItem(STORAGE_KEY)
    if (tasksJson) {
      try {
        return JSON.parse(tasksJson)
      } catch (error) {
        console.error("Error parsing tasks from localStorage:", error)
        return null
      }
    }
  }
  return null
}

