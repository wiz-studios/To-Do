"use client"

import { useState, useRef } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Trash2, Edit, Paperclip, Calendar, ArrowUpDown, Share2 } from "lucide-react"
import { format } from "date-fns"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"

interface TaskItemProps {
  task: Task
  index: number
  onToggleComplete: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
  onEditTask: (taskId: string) => void
  onReorderTasks: (dragIndex: number, hoverIndex: number) => void
}

export default function TaskItem({
  task,
  index,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onReorderTasks,
}: TaskItemProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Set up drag and drop
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: "TASK",
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return
      }

      const dragIndex = item.index
      const hoverIndex = index

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect()

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Determine mouse position
      const clientOffset = monitor.getClientOffset()

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Time to actually perform the action
      onReorderTasks(dragIndex, hoverIndex)

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex
    },
  })

  // Initialize drag and drop refs
  drag(drop(ref))

  // Get priority badge color
  const getPriorityColor = () => {
    switch (task.priority) {
      case "high":
        return "bg-red-500 hover:bg-red-600"
      case "medium":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "low":
        return "bg-green-500 hover:bg-green-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  // Format due date
  const formattedDueDate = task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : null

  // Handle file download
  const handleDownloadFile = (file: { name: string; data: string }) => {
    const link = document.createElement("a")
    link.href = file.data
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render rich text content
  const renderRichText = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/<span style="color:(.*?)">(.*?)<\/span>/g, '<span style="color:$1">$2</span>')
  }

  // Add this function inside the TaskItem component
  const handleShare = async (task: Task) => {
    const taskDetails = `Task: ${task.title}\nPriority: ${task.priority}\n${
      task.dueDate ? `Due Date: ${new Date(task.dueDate).toLocaleDateString()}\n` : ''
    }${task.notes ? `Notes: ${task.notes}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Task Details',
          text: taskDetails,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(taskDetails);
        alert('Task details copied to clipboard!');
      } catch (error) {
        console.log('Error copying to clipboard:', error);
      }
    }
  };

  return (
    <div
      ref={ref}
      className={`task-item p-4 mb-3 ${isDragging ? "opacity-50" : "opacity-100"} ${
        task.completed ? "bg-gray-100 dark:bg-gray-700" : ""
      } transition-all duration-200 ease-in-out`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 cursor-grab" title="Drag to reorder">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
        </div>
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          id={`task-${task.id}`}
          className="flex-shrink-0"
        />
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <label
              htmlFor={`task-${task.id}`}
              className={`font-medium cursor-pointer ${
                task.completed ? "line-through text-gray-500 dark:text-gray-400" : ""
              }`}
            >
              {task.title}
            </label>
            {task.priority && <Badge className={`${getPriorityColor()} text-white text-xs`}>{task.priority}</Badge>}
            {task.recurring && (
              <Badge variant="outline" className="text-xs">
                {task.recurring}
              </Badge>
            )}
          </div>
          {formattedDueDate && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Calendar className="h-3 w-3 mr-1" />
              {formattedDueDate}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {task.attachments && task.attachments.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setIsOpen(!isOpen)}
              title="View attachments"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => handleShare(task)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => onEditTask(task.id)}
            title="Edit task"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-700 rounded-full"
            onClick={() => onDeleteTask(task.id)}
            title="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent className="mt-2 space-y-2">
          {task.notes && (
            <div className="text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              <p className="font-medium text-xs mb-1 text-gray-500 dark:text-gray-400">Notes:</p>
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderRichText(task.notes) }} />
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div>
              <p className="font-medium text-xs mb-1 text-gray-500 dark:text-gray-400">Attachments:</p>
              <div className="flex flex-wrap gap-2">
                {task.attachments.map((file, fileIndex) => (
                  <Button
                    key={fileIndex}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full"
                    onClick={() => handleDownloadFile(file)}
                  >
                    <Paperclip className="h-3 w-3 mr-1" />
                    {file.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

