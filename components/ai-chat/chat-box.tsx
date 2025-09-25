'use client'

import { Card } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { X, Send } from "lucide-react"
import { useState } from "react"
import { ChatMessage } from "./chat-message"

interface ChatBoxProps {
    onClose: () => void
}

export function ChatBox({ onClose }: ChatBoxProps) {
  const [message, setMessage] = useState('')

  return (
    <Card className="absolute bottom-16 right-0 w-80 h-96 flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold">Chat Support</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Messages will be rendered here */}
      </div>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}