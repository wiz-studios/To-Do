"use client"

import { useMemo } from "react"
import type { Task } from "@/lib/types"
import TaskItem from "@/components/task-item"

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onEditTask: (taskId: string) => void
  onReorderTasks: (dragIndex: number, hoverIndex: number) => void
}

export default function TaskList({ tasks, onToggleComplete, onDeleteTask, onEditTask, onReorderTasks }: TaskListProps) {
  // Sort tasks by completion status and then by priority
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1
      }

      // Then sort by due date if available
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      } else if (a.dueDate) {
        return -1
      } else if (b.dueDate) {
        return 1
      }

      // Then sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const aPriority = a.priority ? priorityOrder[a.priority as keyof typeof priorityOrder] : 3
      const bPriority = b.priority ? priorityOrder[b.priority as keyof typeof priorityOrder] : 3

      return aPriority - bPriority
    })
  }, [tasks])

  if (tasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tasks yet. Add a task to get started!</div>
  }

  return (
    <div className="space-y-3">
      {sortedTasks.map((task, index) => (
        <TaskItem
          key={task.id}
          task={task}
          index={index}
          onToggleComplete={onToggleComplete}
          onDeleteTask={onDeleteTask}
          onEditTask={onEditTask}
          onReorderTasks={onReorderTasks}
        />
      ))}
    </div>
  )
}

