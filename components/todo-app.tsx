"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { useTheme } from "next-themes"
import { Sun, Moon, Download, Upload, Undo, Redo, Share2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import TaskList from "@/components/task-list"
import TaskForm from "@/components/task-form"
import { type Task, type TaskAction, ActionType } from "@/lib/types"
import { saveTasksToLocalStorage, getTasksFromLocalStorage } from "@/lib/storage"
import { useTaskHistory } from "@/lib/use-task-history"
import { useNotifications } from "@/lib/use-notifications"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function TodoApp() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { theme, setTheme } = useTheme()
  const { addToHistory, undo, redo, canUndo, canRedo } = useTaskHistory()
  const { requestNotificationPermission, scheduleNotification } = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load tasks from localStorage on initial render
  useEffect(() => {
    const savedTasks = getTasksFromLocalStorage()
    if (savedTasks) {
      setTasks(savedTasks)
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    saveTasksToLocalStorage(tasks)

    // Schedule notifications for tasks with due dates
    tasks.forEach((task) => {
      if (task.dueDate && !task.completed) {
        scheduleNotification(task)
      }
    })
  }, [tasks, scheduleNotification])

  const handleAddTask = (newTask: Task) => {
    const action: TaskAction = {
      type: ActionType.ADD,
      task: newTask,
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
    addToHistory(action)
    setIsFormOpen(false)
    setEditingTask(null)
  }

  const handleUpdateTask = (updatedTask: Task) => {
    const oldTask = tasks.find((t) => t.id === updatedTask.id)

    if (oldTask) {
      const action: TaskAction = {
        type: ActionType.UPDATE,
        task: oldTask,
        updatedTask,
      }

      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      addToHistory(action)
    }

    setIsFormOpen(false)
    setEditingTask(null)
  }

  const handleToggleComplete = (taskId: string) => {
    const taskToToggle = tasks.find((task) => task.id === taskId)

    if (taskToToggle) {
      const updatedTask = {
        ...taskToToggle,
        completed: !taskToToggle.completed,
      }

      const action: TaskAction = {
        type: ActionType.UPDATE,
        task: taskToToggle,
        updatedTask,
      }

      setTasks((prevTasks) => prevTasks.map((task) => (task.id === taskId ? updatedTask : task)))
      addToHistory(action)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((task) => task.id === taskId)

    if (taskToDelete && window.confirm("Are you sure you want to delete this task?")) {
      const action: TaskAction = {
        type: ActionType.DELETE,
        task: taskToDelete,
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
      addToHistory(action)
    }
  }

  const handleEditTask = (taskId: string) => {
    const taskToEdit = tasks.find((task) => task.id === taskId)
    if (taskToEdit) {
      setEditingTask(taskToEdit)
      setIsFormOpen(true)
    }
  }

  const handleReorderTasks = (dragIndex: number, hoverIndex: number) => {
    const draggedTask = tasks[dragIndex]
    const updatedTasks = [...tasks]

    // Remove the task from its original position
    updatedTasks.splice(dragIndex, 1)
    // Insert the task at the new position
    updatedTasks.splice(hoverIndex, 0, draggedTask)

    const action: TaskAction = {
      type: ActionType.REORDER,
      fromIndex: dragIndex,
      toIndex: hoverIndex,
      tasks: [...tasks],
    }

    setTasks(updatedTasks)
    addToHistory(action)
  }

  const handleExportTasks = () => {
    const dataStr = tasks.map((task) => `${task.title}\n${task.notes || ""}\n---\n`).join("\n")
    const dataUri = `data:text/plain;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `todo-tasks-${new Date().toISOString().slice(0, 10)}.txt`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const handleImportTasks = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const taskStrings = content.split("---\n").filter((str) => str.trim() !== "")
        const importedTasks: Task[] = taskStrings.map((taskStr, index) => {
          const [title, notes] = taskStr.trim().split("\n")
          return {
            id: Date.now().toString() + index,
            title: title || "Untitled Task",
            notes: notes || "",
            completed: false,
            createdAt: new Date().toISOString(),
          }
        })

        const action: TaskAction = {
          type: ActionType.IMPORT,
          importedTasks,
          previousTasks: [...tasks],
        }

        setTasks((prevTasks) => [...prevTasks, ...importedTasks])
        addToHistory(action)
      } catch (error) {
        alert("Error importing tasks. Please check the file format.")
        console.error("Import error:", error)
      }
    }
    reader.readAsText(file)

    // Reset the file input
    if (event.target) {
      event.target.value = ""
    }
  }

  const handleUndoAction = () => {
    if (canUndo) {
      const newTasks = undo(tasks)
      if (newTasks) {
        setTasks(newTasks)
      }
    }
  }

  const handleRedoAction = () => {
    if (canRedo) {
      const newTasks = redo(tasks)
      if (newTasks) {
        setTasks(newTasks)
      }
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const handleShareTasks = async () => {
    const taskList = tasks.map((task) => `- ${task.title}`).join("\n")
    const shareText = `My To-Do List:\n\n${taskList}`

    if (navigator.share && navigator.canShare({ text: shareText })) {
      try {
        await navigator.share({
          title: "My To-Do List",
          text: shareText,
        })
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error sharing:", error)
          showFallbackShare(shareText)
        }
      }
    } else {
      showFallbackShare(shareText)
    }
  }

  const showFallbackShare = (shareText: string) => {
    // You can implement a custom dialog or use the browser's built-in prompt
    const textArea = document.createElement("textarea")
    textArea.value = shareText
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand("copy")
      alert("Task list copied to clipboard!")
    } catch (err) {
      console.error("Failed to copy text: ", err)
      alert("Couldn't copy to clipboard. Here's your task list:\n\n" + shareText)
    }
    document.body.removeChild(textArea)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="gradient-bg min-h-screen p-2 sm:p-4 md:p-8">
        <Card className="max-w-[95%] w-full sm:max-w-4xl mx-auto bg-white/90 dark:bg-card/90 backdrop-blur-sm">
          <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">To-Do App</CardTitle>
            <div className="button-row">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="h-3 w-3 sm:h-4 sm:w-4" /> : <Moon className="h-3 w-3 sm:h-4 sm:w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleExportTasks}
                title="Export Tasks"
                className="rounded-full"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleImportTasks}
                title="Import Tasks"
                className="rounded-full"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt" className="hidden" />
              <Button
                variant="outline"
                size="icon"
                onClick={handleUndoAction}
                disabled={!canUndo}
                title="Undo"
                className="rounded-full"
              >
                <Undo className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRedoAction}
                disabled={!canRedo}
                title="Redo"
                className="rounded-full"
              >
                <Redo className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="Share Tasks" className="rounded-full">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Tasks</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p>Would you like to share your task list?</p>
                    <Button className="mt-4 button-gradient" onClick={handleShareTasks}>
                      Share
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="card-responsive">
            {isFormOpen ? (
              <TaskForm
                onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                onCancel={() => {
                  setIsFormOpen(false)
                  setEditingTask(null)
                }}
                initialTask={editingTask}
              />
            ) : (
              <Button
                onClick={() => {
                  setIsFormOpen(true)
                  setEditingTask(null)
                  requestNotificationPermission()
                }}
                className="mb-4 button-gradient"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New Task
              </Button>
            )}

            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onEditTask={handleEditTask}
              onReorderTasks={handleReorderTasks}
            />
          </CardContent>
        </Card>
      </div>
    </DndProvider>
  )
}

