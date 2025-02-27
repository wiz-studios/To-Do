"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, Paperclip } from "lucide-react"
import { format } from "date-fns"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

interface TaskFormProps {
  onSubmit: (task: Task) => void
  onCancel: () => void
  initialTask?: Task | null
}

export default function TaskForm({ onSubmit, onCancel, initialTask }: TaskFormProps) {
  const [title, setTitle] = useState(initialTask?.title || "")
  const [priority, setPriority] = useState<string>(initialTask?.priority || "medium")
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialTask?.dueDate ? new Date(initialTask.dueDate) : undefined,
  )
  const [recurring, setRecurring] = useState<string | undefined>(initialTask?.recurring || undefined)
  const [attachments, setAttachments] = useState<Array<{ name: string; data: string }>>(initialTask?.attachments || [])
  const [additionalNotes, setAdditionalNotes] = useState<string[]>(initialTask?.additionalNotes || [])
  const [newNote, setNewNote] = useState("")

  useEffect(() => {
    const titleInput = document.getElementById("task-title")
    if (titleInput) {
      titleInput.focus()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert("Please enter a task title")
      return
    }

    const task: Task = {
      id: initialTask?.id || Date.now().toString(),
      title,
      completed: initialTask?.completed || false,
      createdAt: initialTask?.createdAt || new Date().toISOString(),
      priority: priority as "high" | "medium" | "low",
      dueDate: dueDate?.toISOString(),
      recurring: recurring as "daily" | "weekly" | "monthly" | undefined,
      additionalNotes: additionalNotes.length > 0 ? additionalNotes : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    }

    onSubmit(task)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments((prev) => [
            ...prev,
            {
              name: file.name,
              data: event.target?.result as string,
            },
          ])
        }
      }
      reader.readAsDataURL(file)
    })

    e.target.value = ""
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      setAdditionalNotes([...additionalNotes, newNote.trim()])
      setNewNote("")
    }
  }

  const handleRemoveNote = (index: number) => {
    setAdditionalNotes(additionalNotes.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task-title">Task Title</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
            className="rounded-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-priority">Priority</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger id="task-priority" className="rounded-full">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-due-date">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal rounded-full",
                  !dueDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Select a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar 
                mode="single" 
                selected={dueDate} 
                onSelect={setDueDate} 
                fromDate={new Date()} 
                initialFocus 
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-recurring">Recurring</Label>
          <Select
            value={recurring || "Not recurring"}
            onValueChange={(value) => setRecurring(value === "Not recurring" ? undefined : value)}
          >
            <SelectTrigger id="task-recurring" className="rounded-full">
              <SelectValue placeholder="Not recurring" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not recurring">Not recurring</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="additional-notes">Additional Notes</Label>
        <div className="flex items-center gap-2">
          <Input
            id="additional-notes"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add an item"
            className="rounded-full"
          />
          <Button type="button" onClick={handleAddNote} className="rounded-full">
            Add
          </Button>
        </div>
        {additionalNotes.length > 0 && (
          <ul className="list-disc list-inside mt-2">
            {additionalNotes.map((note, index) => (
              <li key={index} className="flex items-center justify-between">
                <span>{note}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveNote(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="task-attachments">Attachments</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="cursor-pointer rounded-full"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Add File
          </Button>
          <input id="file-upload" type="file" multiple className="hidden" onChange={handleFileChange} />
        </div>

        {attachments.length > 0 && (
          <div className="mt-2">
            <p className="font-medium text-xs mb-1 text-gray-500 dark:text-gray-400">Attached files:</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  <span className="truncate max-w-[150px]">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
                    onClick={() => removeAttachment(index)}
                  >
                    &times;
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="rounded-full">
          Cancel
        </Button>
        <Button type="submit" className="button-gradient rounded-full">
          {initialTask ? "Update Task" : "Add Task"}
        </Button>
      </div>
    </form>
  )
}

