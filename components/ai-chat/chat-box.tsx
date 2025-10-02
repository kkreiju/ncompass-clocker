'use client'

import { Card } from "../ui/card"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { X, Send, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { ChatMessage } from "./chat-message"
import { useChat } from "../../hooks/use-chat"

interface ChatBoxProps {
    onClose: () => void
}

export function ChatBox({ onClose }: ChatBoxProps) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, isLoading, sendMessage } = useChat({ 
    apiUrl: process.env.NODE_ENV === 'production' ? 'https://n8n-pw79.onrender.com/webhook/ai-chat' : 'https://n8n-pw79.onrender.com/webhook-test/ai-chat'
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      await sendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <Card className="absolute bottom-16 right-0 w-80 h-96 flex flex-col">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold">Chat Support</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Start a conversation...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg.content}
              isUser={msg.role === 'user'}
              timestamp={new Date()}
            />
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button 
          size="icon" 
          onClick={handleSendMessage}
          disabled={!message.trim() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </Card>
  )
}