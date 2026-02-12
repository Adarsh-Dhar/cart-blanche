'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Menu, Settings, ShoppingBag, Zap, Lock } from 'lucide-react'
import { MessageTimestamp } from '@/components/message-timestamp'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  status?: 'thinking' | 'complete'
  intent?: {
    category?: string
    budget?: number
    items?: string[]
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Galactic Gateway AI Shopping Concierge! I\'m here to help you find the perfect space-themed items. What are you looking for today?',
      timestamp: new Date(),
      status: 'complete',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        {
          content:
            'I found some great options for you! Let me search our inventory and create an Intent Mandate for your approval.',
          intent: {
            category: 'Space Suits',
            budget: 20000,
            items: ['Astral Trek Attire NJ-2', 'Saturn Journey Drop'],
          },
        },
        {
          content:
            'Based on your request, I\'m analyzing merchant options and building a Cart Mandate. I found 3 highly-rated sellers offering what you need at excellent prices.',
        },
        {
          content:
            'Great! I\'ve prepared a Payment Mandate for your signature. Once you approve, I\'ll complete the transaction securely using your Web3 wallet.',
        },
      ]

      const randomResponse = responses[Math.floor(Math.random() * responses.length)]

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse.content,
        timestamp: new Date(),
        status: 'complete',
        intent: randomResponse.intent,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-64 border-r border-border/30 bg-card/50 backdrop-blur-sm p-4 flex flex-col overflow-hidden">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-neon mb-8">
            <span className="text-xl">🚀</span>
            <span>Galactic Gateway</span>
          </Link>

          <div className="space-y-2 mb-6">
            <Button
              variant="outline"
              className="w-full justify-start border-border/50 text-left bg-transparent"
              onClick={() => {
                setMessages([
                  {
                    id: '1',
                    role: 'assistant',
                    content:
                      'Welcome to a new conversation! What would you like to shop for today?',
                    timestamp: new Date(),
                    status: 'complete',
                  },
                ])
              }}
            >
              + New Chat
            </Button>
          </div>

          <div className="flex-1 space-y-2 mb-6 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground px-2">Recent Conversations</p>
            {['Find space suits', 'Helmet recommendations', 'Budget shopping'].map((chat, i) => (
              <button
                key={i}
                className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 text-sm transition text-muted-foreground hover:text-foreground"
              >
                {chat}
              </button>
            ))}
          </div>

          <div className="border-t border-border/30 pt-4 space-y-2">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
              <Link href="/wallet">
                <ShoppingBag className="w-4 h-4" />
                Wallet
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="lg:hidden p-2 hover:bg-card rounded transition"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg">Shopping Assistant</h1>
              <p className="text-xs text-muted-foreground">AI-powered shopping concierge</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/settings">Settings</Link>
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info Banner */}
          <Card className="border-border/50 bg-card/50 p-4 border-l-2 border-l-primary">
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">How it works</p>
                <p className="text-xs text-muted-foreground">
                  I analyze your request, search for the best options, and prepare mandates for your approval. You stay in control throughout the process.
                </p>
              </div>
            </div>
          </Card>

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none'
                    : 'bg-card border border-border/50 rounded-2xl rounded-tl-none'
                } px-4 py-3`}
              >
                <p className="text-sm">{message.content}</p>

                {/* Intent Display */}
                {message.intent && (
                  <Card className="mt-3 border-border/50 bg-background/50 p-3 text-foreground">
                    <p className="text-xs font-semibold mb-2">Intent Mandate Preview</p>
                    {message.intent.category && (
                      <p className="text-xs mb-1">
                        <span className="text-muted-foreground">Category:</span> {message.intent.category}
                      </p>
                    )}
                    {message.intent.budget && (
                      <p className="text-xs mb-1">
                        <span className="text-muted-foreground">Budget:</span> ${(message.intent.budget / 100).toFixed(2)}
                      </p>
                    )}
                    {message.intent.items && message.intent.items.length > 0 && (
                      <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Suggested Items:</p>
                        <ul className="ml-2 space-y-0.5">
                          {message.intent.items.map((item, i) => (
                            <li key={i} className="text-xs">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 h-8"
                    >
                      Approve Intent
                    </Button>
                  </Card>
                )}

                <MessageTimestamp date={message.timestamp} />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-sm p-4">
          <Card className="border-border/50 bg-card/50 p-1 flex gap-1">
            <Input
              placeholder="Describe what you're looking for..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:outline-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </Card>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by secure AI commerce
          </p>
        </div>
      </div>
    </div>
  )
}
