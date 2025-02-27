"use client"

import TodoApp from "@/components/todo-app"

export default function Home() {
  const handleShareTask = async (task: Task) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: task.title,
          text: `Task: ${task.title}\nPriority: ${task.priority}\n${
            task.notes ? `Notes: ${task.notes}` : ""
          }`,
          url: window.location.href,
        })
        
        // Update the task's shared status
        const updatedTasks = tasks.map((t) =>
          t.id === task.id ? { ...t, shared: true } : t
        )
        setTasks(updatedTasks)
      } catch (error) {
        console.error("Error sharing task:", error)
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      const shareText = `Task: ${task.title}\nPriority: ${task.priority}\n${
        task.notes ? `Notes: ${task.notes}` : ""
      }`
      alert("Sharing not supported on this browser. Task details:\n\n" + shareText)
    }
  }

  return (
    <main className="min-h-screen p-4 md:p-8">
      <TodoApp />
    </main>
  )
}

