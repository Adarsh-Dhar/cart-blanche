'use client'

import { useState, useRef, useEffect } from 'react'
import { useX402 } from '@/hooks/useX402'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Menu, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from '@/hooks/use-toast'

interface Message {
  role: 'user' | 'assistant';
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  intent?: any;
}

export default function ChatPage() {
  const { signMandate } = useX402();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Welcome to Cart Blanche! I am your AI Project Orchestrator. Whether you are outfitting your first day of school, planning a wedding, or organizing a hiking trip, tell me your goal and budget, and I will handle the rest.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userId] = useState("guest_user");
  const [sessionId] = useState("test-session-001");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 🚨 UI CLEANER: Removes internal agent routing and repeated signatures
  const cleanMessageContent = (content: string) => {
    if (!content) return "";
    return content.replace(/For context:\[.*?\] said:\s*/g, '');
  };

  // Main message sending and streaming handler
  async function sendMessage(e?: React.FormEvent | React.KeyboardEvent, overrideText?: string) {
    if (e) e.preventDefault();
    const userText = overrideText !== undefined ? overrideText : input.trim();
    if (!userText) return;
    
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInput("");
    
    try {
      // 🚨 1. CREATE THE SESSION FIRST (Prevents the 404 Error) 🚨
      await fetch(`http://127.0.0.1:8000/apps/shopping_concierge/users/${userId}/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).catch(() => {}); // Safely ignore if it already exists

      // 🚨 2. SEND THE MESSAGE TO THE STREAM 🚨
      const response = await fetch("http://127.0.0.1:8000/run_sse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        },
        body: JSON.stringify({
          app_name: "shopping_concierge",
          user_id: userId,
          session_id: sessionId,
          // 🚨 THE FIX: Use 'new_message' to satisfy Pydantic 🚨
          new_message: { role: "user", parts: [{ text: userText }] }
        }),
      });

      if (!response.ok) throw new Error(`Backend Error ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentAgentMessage = '';

      // Create a blank bubble for the AI stream to fill
      setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr.trim() === '[DONE]') continue;
            try {
              const eventData = JSON.parse(dataStr);
              if (eventData?.content?.parts?.[0]?.text) {
                currentAgentMessage += eventData.content.parts[0].text;
                let displayText = currentAgentMessage;
                const stopIndex = displayText.indexOf('```json');
                const stopIndexText = displayText.indexOf('Please sign the EIP-712');
                if (stopIndex !== -1) displayText = displayText.substring(0, stopIndex).trim();
                else if (stopIndexText !== -1) displayText = displayText.substring(0, stopIndexText).trim();
                setMessages((prev) => {
                  const newArray = [...prev];
                  newArray[newArray.length - 1].text = displayText;
                  return newArray;
                });
              }
            } catch (err) { 
              // Ignore parse errors on incomplete chunks
            }
          }
        }
      }

      // Extract EIP-712 JSON
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let mandatePayload: any = null;
      const jsonMatch = currentAgentMessage.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        try { mandatePayload = JSON.parse(jsonMatch[1].trim()); } catch (e) {}
      }
      if (!mandatePayload) {
        const rawJsonMatch = currentAgentMessage.match(/(\{[\s\S]*"merchant_address"[\s\S]*\})/);
        if (rawJsonMatch && rawJsonMatch[1]) {
          try { mandatePayload = JSON.parse(rawJsonMatch[1].trim()); } catch (e) {}
        }
      }
      if (mandatePayload?.cart_mandate) mandatePayload = mandatePayload.cart_mandate;

      // Ensure EIP-712 structural integrity
      if (mandatePayload) {
         const rawMsg = mandatePayload.message || mandatePayload;
         let extractedAddress = rawMsg.merchant_address || rawMsg.merchant;
         if (!extractedAddress || !extractedAddress.startsWith('0x')) {
            extractedAddress = "0xFe5e03799Fe833D93e950d22406F9aD901Ff3Bb9";
         }
         let extractedAmount = rawMsg.amount || rawMsg.total_budget_amount || rawMsg.total_budget || rawMsg.total_usd || 0;
         if (typeof extractedAmount === 'string') {
            extractedAmount = parseInt(extractedAmount.replace(/[^0-9]/g, '')) || 0;
         }

         mandatePayload = {
            domain: {
              name: "CartBlanche",
              version: "1",
              chainId: 324705682
            },
            types: {
              CartMandate: [
                { name: "merchant_address", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "currency", type: "string" }
              ]
            },
            primaryType: "CartMandate",
            message: {
                merchant_address: extractedAddress,
                amount: extractedAmount,
                currency: rawMsg.currency || "USDC"
            }
         };
      }

      // Auto-trigger MetaMask
      if (mandatePayload && mandatePayload.domain) {
        setTimeout(async () => {
          try {
            setMessages((prev) => [...prev, { role: 'assistant', text: 'Prompting MetaMask for secure signature approval...' }]);
            const signature = await signMandate(mandatePayload);
            // Let the stream handle the receipt, do not hardcode a fake success UI here
            await sendMessage(undefined, `Here is my signature for the CartMandate: ${signature}`);
            toast({
              title: "🎉 Transaction Sent!",
              description: "Verifying your signature and settling on SKALE.",
              duration: 5000,
            });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (err: any) {
            console.error(err);
            setMessages((prev) => [...prev, { role: 'assistant', text: `❌ Payment signature was cancelled.` }]);
          }
        }, 500);
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSidebar(!showSidebar)} className="lg:hidden p-2 hover:bg-card rounded transition">
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

          {messages.map((message, idx) => {
            const cleanedText = cleanMessageContent(message.text);
          
            // Skip rendering completely empty agent bubbles
            if (message.role === 'assistant' && !cleanedText) return null;

            // 🚨 AP2 TRACK MULTI-MERCHANT RECEIPT UI 🚨
            if (message.role === 'assistant' && cleanedText.includes('Payment Complete!')) {
              return (
                <div key={idx} className="flex justify-start my-4 w-full">
                  <div className="bg-gradient-to-br from-green-950/40 to-emerald-900/20 border border-green-500/50 rounded-2xl p-5 shadow-[0_0_15px_rgba(34,197,94,0.15)] max-w-2xl w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-500/20 p-2 rounded-full border border-green-500/30">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <h3 className="text-green-400 font-bold text-lg">Batch Settlement Verified</h3>
                    </div>
                    <div className="mb-4 inline-block bg-green-500/10 border border-green-500/20 text-green-300 text-xs px-2 py-1 rounded">
                       x402 Multi-Vendor Escrow Triggered
                    </div>
                    <div className="space-y-2 text-sm bg-black/20 p-4 rounded-lg border border-white/5 text-gray-200">
                      <ReactMarkdown 
                        components={{
                          ul: ({...props}) => <ul className="list-none space-y-3 m-0 p-0" {...props} />,
                          li: ({...props}) => <li className="bg-black/20 border border-green-500/20 p-3 rounded-lg flex flex-col gap-1 break-all" {...props} />, 
                          strong: ({...props}) => <strong className="text-green-300 font-semibold text-base" {...props} />, 
                          a: ({...props}) => <a className="text-blue-400 hover:text-blue-300 hover:underline text-xs mt-1" target="_blank" {...props} />, 
                          code: ({...props}) => <code className="bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs text-gray-300" {...props} />, 
                          p: ({...props}) => <p className="mb-2 last:mb-0" {...props} />
                        }}
                      >
                        {cleanedText.replace('✅ **Payment Complete!**', '').trim()}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            }

            // Normal Message Rendering
            return (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl ${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none' : 'bg-card border border-border/50 rounded-2xl rounded-tl-none w-full'} px-4 py-3`}>
                
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{cleanedText}</p>
                  ) : (
                    // 🚨 BEAUTIFUL MARKDOWN RENDERING 🚨
                    <ReactMarkdown
                      components={{
                        ol: ({...props}) => <ol className="text-sm leading-relaxed grid grid-cols-1 gap-3 my-4 list-none p-0" {...props} />,
                        ul: ({...props}) => <ul className="text-sm leading-relaxed grid grid-cols-1 gap-3 my-4 list-none p-0" {...props} />,
                        li: ({...props}) => <li className="text-sm leading-relaxed bg-background/50 border border-border rounded-xl p-4 shadow-sm" {...props} />,
                        strong: ({...props}) => <strong className="text-base font-bold text-foreground block mb-2" {...props} />,
                        p: ({...props}) => <p className="text-sm leading-relaxed mb-3 last:mb-0" {...props} />,
                        a: ({...props}) => (
                          <a 
                            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-500 hover:text-blue-400 hover:underline" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            {...props} 
                          />
                        )
                      }}
                    >
                      {cleanedText}
                    </ReactMarkdown>
                  )}

                </div>
              </div>
            );
          })}

          {isLoading && (
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  sendMessage(e);
                }
              }}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:outline-none"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}