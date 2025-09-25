'use client'

import { Button } from "../ui/button"
import { useState } from "react"
import { ChatBox } from "./chat-box"
import { MessageCircle } from "lucide-react"

export function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && <ChatBox onClose={() => setIsOpen(false)} />}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 rounded-full shadow-lg"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  )
}