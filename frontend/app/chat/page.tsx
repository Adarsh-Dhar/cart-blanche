'use client'

import { useState, useRef, useEffect } from 'react'
import { useX402 } from '@/hooks/useX402' // 🚨 Updated to use the correct viem hook
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Menu, Settings, ShoppingBag, Zap } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant';
  text: string;
  intent?: any;
}

export default function ChatPage() {
  const { signMandate } = useX402(); // 🚨 Hook initialization
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Welcome to Galactic Gateway AI Shopping Concierge! I'm here to help you find the perfect space-themed items. What are you looking for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [userId, setUserId] = useState("guest_user");
  const [sessionId, setSessionId] = useState("test-session-001");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Streaming chat logic with cart_mandate auto-interception
  const sendMessage = async (e?: React.FormEvent | React.KeyboardEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    
    // Accept text from either the user input box, or from an automated background message
    const userText = overrideText || input;
    if (!userText.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    if (!overrideText) setInput(""); // Only clear input box if it was a real user message
    setIsLoading(true);

    try {
      // 1. Explicitly create the session first
      await fetch(`http://127.0.0.1:8000/apps/shopping_concierge/users/${userId}/sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(err => console.warn("Session might already exist:", err));

      // 2. Call the ADK SSE endpoint
      const response = await fetch('http://127.0.0.1:8000/run_sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          app_name: 'shopping_concierge',
          user_id: userId,
          session_id: sessionId,
          new_message: {
            role: 'user',
            parts: [{ text: userText }],
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Backend Error ${response.status}: ${errText}`);
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentAgentMessage = '';

      setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);

      // Read the stream
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
              
              // Extract the text token and filter out the ugly raw JSON
              if (eventData?.content?.parts?.[0]?.text) {
                currentAgentMessage += eventData.content.parts[0].text;
                
                // Hide the raw JSON block and instructions from the user's UI
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
              // Ignore parse errors for non-JSON lines
            }
          }
        }
      }

      // 3. 🚨 EXTRACT EIP-712 JSON FROM MARKDOWN
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

      if (mandatePayload?.cart_mandate) {
        mandatePayload = mandatePayload.cart_mandate;
      }

      // 🚨 THE FIX: Bulletproof Reconstructor
      // If the AI took a shortcut and sent the raw data without the EIP-712 wrapper, build it!
      if (mandatePayload && mandatePayload.merchant_address && !mandatePayload.domain) {
         // Safely extract product details whether the AI used a flat structure or an 'items' array
         const pName = mandatePayload.items?.[0]?.name || mandatePayload.product_name || "Cart Order";
         const pQty = mandatePayload.items?.[0]?.quantity || mandatePayload.product_quantity || 1;
         const pPrice = mandatePayload.items?.[0]?.price || mandatePayload.product_unit_price || mandatePayload.amount;

         mandatePayload = {
            domain: {
              name: "CartMandate",
              version: "1",
              chainId: 324705682 // SKALE Base Sepolia chain ID
            },
            types: {
              CartMandate: [
                { name: "merchant_address", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "currency", type: "string" },
                { name: "product_name", type: "string" },
                { name: "product_quantity", type: "uint256" },
                { name: "product_unit_price", type: "uint256" }
              ]
            },
            message: {
                merchant_address: mandatePayload.merchant_address,
                amount: mandatePayload.amount,
                currency: mandatePayload.currency || "USDC",
                product_name: pName,
                product_quantity: pQty,
                product_unit_price: pPrice
            }
         };
      }

      // 🚨 Always sanitize merchant_address type in types to 'address' (never bytes32)
      if (mandatePayload && mandatePayload.types) {
        const typeKeys = Object.keys(mandatePayload.types);
        for (const key of typeKeys) {
          if (Array.isArray(mandatePayload.types[key])) {
            mandatePayload.types[key] = mandatePayload.types[key].map((field: any) => {
              if (field.name === 'merchant_address' && field.type !== 'address') {
                return { ...field, type: 'address' };
              }
              return field;
            });
          }
        }
      }

      // 4. 🚨 AUTO-TRIGGER METAMASK SIGNATURE
      if (mandatePayload && mandatePayload.domain) {
        setTimeout(async () => {
          try {
            setMessages((prev) => [...prev, { role: 'assistant', text: 'Prompting MetaMask for secure signature approval...' }]);
            
            // Trigger MetaMask Popup
            const signature = await signMandate(mandatePayload);
            
            setMessages((prev) => [...prev, { role: 'assistant', text: `✅ Payment mandate signed successfully!` }]);
            
            // Auto-send the signature back to the agent in the background!
            await sendMessage(undefined, `Here is my signature for the CartMandate: ${signature}`);
            
          } catch (err: any) {
            console.error("User rejected signature or it failed:", err);
            setMessages((prev) => [...prev, { role: 'assistant', text: `❌ Payment signature was cancelled.` }]);
          }
        }, 500);
      }

    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* User/session input */}
      <div className="absolute top-2 right-2 z-50 flex gap-2 bg-card/80 p-2 rounded shadow">
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          className="border px-2 py-1 rounded text-xs text-foreground bg-background"
          style={{ width: 120 }}
        />
        <input
          type="text"
          placeholder="Session ID"
          value={sessionId}
          onChange={e => setSessionId(e.target.value)}
          className="border px-2 py-1 rounded text-xs text-foreground bg-background"
          style={{ width: 140 }}
        />
      </div>
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
                setSessionId(`session-${Date.now()}`);
                setMessages([
                  {
                    role: 'assistant',
                    text: 'Welcome to a new conversation! What would you like to shop for today?'
                  },
                ]);
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

          {messages.map((message, idx) => {
            // 🚨 AP2 TRACK RECEIPT UI 🚨
            if (message.role === 'assistant' && message.text.includes('✅ Payment Complete!')) {
              // Extract the Tx Hash from the text string
              const txHashMatch = message.text.match(/TX Hash:\s*(0x[a-zA-Z0-9]+)/);
              const txHash = txHashMatch ? txHashMatch[1] : "0xABC123...";
              
              return (
                <div key={idx} className="flex justify-start my-4 w-full">
                  <div className="bg-gradient-to-br from-green-950/40 to-emerald-900/20 border border-green-500/50 rounded-2xl p-5 shadow-[0_0_15px_rgba(34,197,94,0.15)] max-w-md w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-500/20 p-2 rounded-full border border-green-500/30">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <h3 className="text-green-400 font-bold text-lg">Settlement Verified</h3>
                    </div>
                    
                    <div className="space-y-3 text-sm bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="flex justify-between border-b border-green-500/20 pb-2">
                        <span className="text-muted-foreground">Network</span>
                        <span className="font-mono text-white">SKALE (via CDP)</span>
                      </div>
                      <div className="flex justify-between border-b border-green-500/20 pb-2">
                        <span className="text-muted-foreground">Protocol</span>
                        <span className="font-mono text-white">AP2 / x402</span>
                      </div>
                      <div className="flex flex-col gap-1 pt-1">
                        <span className="text-muted-foreground">Transaction Hash</span>
                        <a href={`https://base-sepolia-testnet-explorer.skalenodes.com/tx/${txHash}`} target="_blank" className="font-mono text-xs text-blue-400 truncate hover:underline bg-blue-500/10 p-1.5 rounded">
                          {txHash}
                        </a>
                      </div>
                    </div>
                    <div className="mt-4 text-[10px] text-green-400/60 text-center uppercase tracking-widest font-bold">
                      Auditable Cryptographic Receipt
                    </div>
                  </div>
                </div>
              );
            }

            // Normal Message Rendering
            return (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl ${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none' : 'bg-card border border-border/50 rounded-2xl rounded-tl-none'} px-4 py-3`}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
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
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Powered by secure AI commerce
          </p>
        </div>
      </div>
    </div>
  )
}