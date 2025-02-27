import { Share2, Trash2 } from "lucide-react"
// ...existing code...

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onShare: (task: Task) => void
}

export function TaskCard({ task, onComplete, onDelete, onEdit, onShare }: TaskCardProps) {
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
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
      // ...existing code...
      <div className="absolute right-2 top-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={() => handleShare(task)}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-500 rounded-full"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(task)}
          className="rounded-full"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(task.id)}
          className="rounded-full text-red-500 hover:text-red-700"
        >
          Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onShare(task)}
          className={cn(
            "rounded-full",
            task.shared && "bg-blue-100 dark:bg-blue-900"
          )}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
