"use client"

import { useState } from "react"
import { type Task, type TaskAction, ActionType } from "./types"

export function useTaskHistory() {
  const [history, setHistory] = useState<TaskAction[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const addToHistory = (action: TaskAction) => {
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, currentIndex + 1)

    // Add the new action to history
    newHistory.push(action)

    // Update history and current index
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
  }

  const undo = (currentTasks: Task[]): Task[] | null => {
    if (currentIndex < 0) return null

    const action = history[currentIndex]
    let newTasks: Task[] = [...currentTasks]

    switch (action.type) {
      case ActionType.ADD:
        if (action.task) {
          newTasks = newTasks.filter((task) => task.id !== action.task!.id)
        }
        break

      case ActionType.DELETE:
        if (action.task) {
          newTasks = [...newTasks, action.task]
        }
        break

      case ActionType.UPDATE:
        if (action.task && action.updatedTask) {
          newTasks = newTasks.map((task) => (task.id === action.updatedTask!.id ? action.task! : task))
        }
        break

      case ActionType.REORDER:
        if (action.tasks) {
          newTasks = [...action.tasks]
        }
        break

      case ActionType.IMPORT:
        if (action.previousTasks) {
          newTasks = [...action.previousTasks]
        }
        break
    }

    setCurrentIndex(currentIndex - 1)
    return newTasks
  }

  const redo = (currentTasks: Task[]): Task[] | null => {
    if (currentIndex >= history.length - 1) return null

    const action = history[currentIndex + 1]
    let newTasks: Task[] = [...currentTasks]

    switch (action.type) {
      case ActionType.ADD:
        if (action.task) {
          newTasks = [...newTasks, action.task]
        }
        break

      case ActionType.DELETE:
        if (action.task) {
          newTasks = newTasks.filter((task) => task.id !== action.task!.id)
        }
        break

      case ActionType.UPDATE:
        if (action.updatedTask) {
          newTasks = newTasks.map((task) => (task.id === action.updatedTask!.id ? action.updatedTask! : task))
        }
        break

      case ActionType.REORDER:
        if (action.fromIndex !== undefined && action.toIndex !== undefined) {
          const taskToMove = newTasks[action.fromIndex]
          newTasks = [...newTasks]
          newTasks.splice(action.fromIndex, 1)
          newTasks.splice(action.toIndex, 0, taskToMove)
        }
        break

      case ActionType.IMPORT:
        if (action.importedTasks) {
          newTasks = [...action.importedTasks]
        }
        break
    }

    setCurrentIndex(currentIndex + 1)
    return newTasks
  }

  return {
    addToHistory,
    undo,
    redo,
    canUndo: currentIndex >= 0,
    canRedo: currentIndex < history.length - 1,
  }
}

