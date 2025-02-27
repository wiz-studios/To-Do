import { Share2, Trash2, AlignLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil } from "lucide-react"
import { type Task } from "@/lib/types"
import { useDrag, useDrop } from "react-dnd"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { useRef } from "react"
import { format } from "date-fns"

interface TaskCardProps {
  task: Task
  index: number
  onToggleComplete: (id: string) => void
  onDeleteTask: (id: string) => void
  onEditTask: (id: string) => void
  onReorderTasks: (dragIndex: number, hoverIndex: number) => void
  onShare: (task: Task) => void
}

export default function TaskCard({
  task,
  index,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onReorderTasks,
  onShare,
}: TaskCardProps) {
  const dragDropRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'TASK',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [, drop] = useDrop({
    accept: 'TASK',
    hover: (item: { index: number }, monitor) => {
      if (!dragDropRef.current) {
        return
      }

      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = dragDropRef.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      onReorderTasks(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  preview(previewRef)
  drag(drop(dragDropRef))

  const handleShare = async (task: Task) => {
    const shareText = `Task: ${task.title}\nDue: ${task.dueDate ? format(new Date(task.dueDate), 'PPP') : 'No due date'}\nPriority: ${task.priority}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shared Task',
          text: shareText
        })
      } catch (err) {
        console.log('Share failed:', err)
      }
    } else {
      navigator.clipboard.writeText(shareText)
      // You might want to add a toast notification here
      alert('Task details copied to clipboard!')
    }
  }

  return (
    <div ref={previewRef}>
      <div ref={dragDropRef} style={{ opacity: isDragging ? 0.5 : 1 }}>
        <Card className="mb-3 cursor-move">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => onToggleComplete(task.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                    {task.notes && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        - {task.notes}
                      </span>
                    )}
                  </span>
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                </div>
                {task.dueDate && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onEditTask(task.id)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => handleShare(task)}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
