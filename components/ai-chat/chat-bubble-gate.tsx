'use client'

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { ChatBubble } from "./chat-bubble"

export function ChatBubbleGate() {
  const [hasAdminToken, setHasAdminToken] = useState(false)
  const [checked, setChecked] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null
      setHasAdminToken(Boolean(token))
    } finally {
      setChecked(true)
    }
  }, [pathname])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'adminToken') {
        setHasAdminToken(Boolean(e.newValue))
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  if (!checked || !hasAdminToken) return null

  return <ChatBubble />
}


