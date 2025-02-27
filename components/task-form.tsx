"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { CalendarIcon, Paperclip, Bold, Italic, Underline } from "lucide-react"
import { format } from "date-fns"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
  const [notes, setNotes] = useState(initialTask?.notes || "")
  const [attachments, setAttachments] = useState<Array<{ name: string; data: string }>>(initialTask?.attachments || [])

  const [textColor, setTextColor] = useState("#000000")

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
      notes: notes || undefined,
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

  const applyTextStyle = (style: string) => {
    const textarea = document.getElementById("task-notes") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = notes.substring(start, end)

    let newText = ""
    switch (style) {
      case "bold":
        newText = `**${selectedText}**`
        break
      case "italic":
        newText = `*${selectedText}*`
        break
      case "underline":
        newText = `__${selectedText}__`
        break
      default:
        newText = selectedText
    }

    setNotes(notes.substring(0, start) + newText + notes.substring(end))
  }

  const applyTextColor = () => {
    const textarea = document.getElementById("task-notes") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = notes.substring(start, end)

    const newText = `<span style="color:${textColor}">${selectedText}</span>`
    setNotes(notes.substring(0, start) + newText + notes.substring(end))
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
            className="w-full px-3 py-2 text-sm sm:text-base rounded border"
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
        <Label htmlFor="task-notes">Notes</Label>
        <div className="flex items-center space-x-2 mb-2">
          <ToggleGroup type="multiple" className="rounded-full">
            <ToggleGroupItem
              value="bold"
              aria-label="Toggle bold"
              onClick={() => applyTextStyle("bold")}
              className="rounded-full"
            >
              <Bold className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="italic"
              aria-label="Toggle italic"
              onClick={() => applyTextStyle("italic")}
              className="rounded-full"
            >
              <Italic className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="underline"
              aria-label="Toggle underline"
              onClick={() => applyTextStyle("underline")}
              className="rounded-full"
            >
              <Underline className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[80px] rounded-full" style={{ backgroundColor: textColor }}>
                Color
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px]">
              <div className="space-y-2">
                <Label htmlFor="text-color">Select Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    id="text-color"
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 border-none rounded-full"
                  />
                  <Button onClick={applyTextColor} className="rounded-full">
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <Textarea
          id="task-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes (optional)"
          className="w-full px-3 py-2 text-sm sm:text-base rounded border min-h-[100px]"
        />
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

