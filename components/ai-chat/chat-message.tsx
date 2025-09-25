interface ChatMessageProps {
    message: string
    isUser?: boolean
    timestamp: Date
}

export function ChatMessage({message, isUser = false, timestamp }: ChatMessageProps){
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-2`}>
            <div className={`rounded-lg px-4 py-2 max-w-[80%] ${
                isUser ? 'bg-primary text-primary-foreground': 'bg-muted'
            }`}>
            <p className = "text-sm"> {message}</p>
            <span className="text-xs opacity-70">
                {timestamp.toLocaleTimeString()}
            </span>
            </div>
        </div>
    )
}