"use client"

import { useState, useEffect, useCallback } from "react"
import type { Task } from "./types"

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        const newPermission = await Notification.requestPermission()
        setPermission(newPermission)
        return newPermission
      }
      return Notification.permission
    }
    return "denied"
  }, [])

  const scheduleNotification = useCallback(
    (task: Task) => {
      if (typeof window !== "undefined" && "Notification" in window && permission === "granted" && task.dueDate) {
        const dueDate = new Date(task.dueDate)
        const now = new Date()

        // If due date is in the future
        if (dueDate > now) {
          const timeUntilDue = dueDate.getTime() - now.getTime()

          // Schedule notification 30 minutes before due time
          const notificationTime = Math.max(0, timeUntilDue - 30 * 60 * 1000)

          setTimeout(() => {
            new Notification("Task Reminder", {
              body: `Your task "${task.title}" is due in 30 minutes.`,
              icon: "/favicon.ico",
            })
          }, notificationTime)

          // Also schedule a notification at the due time
          setTimeout(() => {
            new Notification("Task Due", {
              body: `Your task "${task.title}" is now due.`,
              icon: "/favicon.ico",
            })
          }, timeUntilDue)
        }
      }
    },
    [permission],
  )

  return {
    permission,
    requestNotificationPermission,
    scheduleNotification,
  }
}

