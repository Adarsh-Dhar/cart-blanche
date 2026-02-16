'use client'

import { useState, useRef, useEffect } from 'react'
import { useX402 } from '@/hooks/useX402'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Send, Menu, Zap, ExternalLink } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { toast } from '@/hooks/use-toast'
import { TransactionReceipt } from '@/components/TransactionReceipt'

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
  const [lastUserText, setLastUserText] = useState("");
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

  // 🚨 UI CLEANER: Aggressively removes JSON, Signatures, Fluff, and Collapses Duplicates 🚨
  const cleanMessageContent = (content: string) => {
    if (!content) return "";

    // 🚨 ALLOW ERRORS THROUGH IMMEDIATELY 🚨
    if (content.includes("❌ Payment processor error:")) {
        return content.trim(); // Do not apply any other filters to errors!
    }

    let cleaned = content.replace(/For context:\[.*?\] said:\s*/g, '');
    
    // Hide Orchestrator tags
    cleaned = cleaned.replace(/<orchestrator>[\s\S]*?<\/orchestrator>/ig, '');
    if (cleaned.includes('<orchestrator>') && !cleaned.includes('</orchestrator>')) {
         cleaned = cleaned.replace(/<orchestrator>[\s\S]*/ig, '');
    }

    // Strip Gemini's stubborn intro lines
    cleaned = cleaned.replace(/Here is a proposed plan.*?:/ig, '');
    cleaned = cleaned.replace(/I will break down your request.*?:/ig, '');
    
    // Remove raw JSON blocks and authorized flags, but allow JSON blocks if they contain tx_hash (receipt)
    if (!content.includes('tx_hash')) {
      cleaned = cleaned.replace(/```(?:json)?\n[\s\S]*?\n```/g, '');
    }
    cleaned = cleaned.replace(/\{"authorized":\s*true[\s\S]*?\}/g, '');
    cleaned = cleaned.replace(/Here is my signature for the CartMandate: 0x[a-fA-F0-9]+/g, '');
    cleaned = cleaned.replace(/Signature received.*?(proceed|authorized)\.?/ig, '');
    cleaned = cleaned.replace(/The batch transaction is authorized.*?proceed\./ig, '');
    // cleaned = cleaned.replace(/Your transactions have been securely settled on the SKALE network\.?/ig, '');
    // cleaned = cleaned.replace(/✅ \*\*Payment Complete!\*\*/g, '');
    
    // 🚨 REGEX COLLAPSER: If the massive 100+ char list still repeats back-to-back, collapse it to 1!
    cleaned = cleaned.replace(/([\s\S]{50,})\1+/g, '$1');

    cleaned = cleaned.trim();
    // (Removed filter for confirmation phrases so they are shown)
    return cleaned;
  };

  async function sendMessage(e?: React.FormEvent | React.KeyboardEvent, overrideText?: string, hideUserMessage?: boolean) {
    if (e) e.preventDefault();
    const userText = overrideText !== undefined ? overrideText : input.trim();
    if (!userText) return;
    
    setIsLoading(true);
    setLastUserText(userText); // Save for anti-echo logic
    
    if (!hideUserMessage) {
      setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    }
    setInput("");
    
    try {
      await fetch(`http://127.0.0.1:8000/apps/shopping_concierge/users/${userId}/sessions/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).catch(() => {});

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
          new_message: { role: "user", parts: [{ text: userText }] }
        }),
      });

      if (!response.ok) throw new Error(`Backend Error ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentAgentMessage = '';

      if (!hideUserMessage) {
        setMessages((prev) => [...prev, { role: 'assistant', text: '' }]);
      }

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
                let textChunk = eventData.content.parts[0].text;
                
                // 🚨 ANTI-DUPLICATION ARMOR 🚨

                // 1. If ADK echoes the user's prompt back, strip it out invisibly.
                if (userText.length > 5 && textChunk.includes(userText)) {
                    textChunk = textChunk.replace(userText, '');
                }

                // 2. If ADK dumps the massive full message after streaming the chunks, DROP IT.
                // It checks if a large chunk's first 25 characters are already painted on screen.
                if (textChunk.length > 30 && currentAgentMessage.includes(textChunk.substring(0, 25))) {
                    continue; 
                }

                currentAgentMessage += textChunk;
                
                let displayText = currentAgentMessage;
                // Only hide the mandate if we haven't reached the "Payment Complete" or "settled" stage
                if (!displayText.includes("Payment Complete") && !displayText.includes("settled")) {
                  const stopIndex = displayText.indexOf('```json');
                  const stopIndexText = displayText.indexOf('Please sign the EIP-712');
                  if (stopIndex !== -1) displayText = displayText.substring(0, stopIndex).trim();
                  else if (stopIndexText !== -1) displayText = displayText.substring(0, stopIndexText).trim();
                }
                
                if (!hideUserMessage) {
                  setMessages((prev) => {
                    const newArray = [...prev];
                    newArray[newArray.length - 1].text = displayText;
                    return newArray;
                  });
                }
              }
            } catch (err) { }
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
                currency: rawMsg.currency || "USDC",
                merchants: rawMsg.merchants || []
            }
         };
      }

      // Auto-trigger MetaMask
      if (mandatePayload && mandatePayload.domain) {
        setTimeout(async () => {
          try {
            const signature = await signMandate(mandatePayload);
            await sendMessage(undefined, `Here is my signature for the CartMandate: ${signature}`, true);
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
            if (!cleanedText) return null;

            // Try to extract a JSON block with tx_hash for receipts
            let receipt = null;
            if (message.role === 'assistant') {
              const jsonMatch = message.text.match(/```(?:json)?\n([\s\S]*?)\n```/);
              if (jsonMatch && jsonMatch[1] && jsonMatch[1].includes('tx_hash')) {
                try { receipt = JSON.parse(jsonMatch[1].trim()); } catch {}
              } else {
                // Try to find a raw JSON object with tx_hash
                const rawJsonMatch = message.text.match(/(\{[\s\S]*?tx_hash[\s\S]*?\})/);
                if (rawJsonMatch && rawJsonMatch[1]) {
                  try { receipt = JSON.parse(rawJsonMatch[1].trim()); } catch {}
                }
              }
            }

            return (
              <div key={idx} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${message.role === 'user' ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3' : 'bg-transparent w-full'}`}>
                  {message.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{cleanedText}</p>
                  ) : receipt ? (
                    <TransactionReceipt receipt={receipt} />
                  ) : (
                    <div className="w-full 
                      [&_ol]:border [&_ol]:border-border/60 [&_ol]:bg-card [&_ol]:rounded-xl [&_ol]:overflow-hidden [&_ol]:my-4 [&_ol]:list-none [&_ol]:p-0 [&_ol]:divide-y [&_ol]:divide-border/50 [&_ol]:shadow-sm
                      [&_ol>li]:px-4 [&_ol>li]:py-3 [&_ol>li]:transition-colors hover:[&_ol>li]:bg-muted/30
                      [&_ol>li_p]:m-0 
                      [&_ol>li_strong]:text-sm [&_ol>li_strong]:font-bold [&_ol>li_strong]:text-foreground [&_ol>li_strong]:block
                      [&_ul]:flex [&_ul]:flex-wrap [&_ul]:items-center [&_ul]:gap-x-1 [&_ul]:text-xs [&_ul]:text-muted-foreground [&_ul]:list-none [&_ul]:p-0 [&_ul]:m-0 [&_ul]:mt-1.5
                      [&_ul>li]:flex [&_ul>li]:items-center
                      [&_ul>li:not(:first-child)]:before:content-['•'] [&_ul>li:not(:first-child)]:before:mx-2 [&_ul>li:not(:first-child)]:before:text-muted-foreground/40
                      
                      /* Fallback UI just in case the AI forgets to use numbers */
                      [&>p]:text-sm [&>p]:leading-relaxed [&>p]:mb-3 [&>p]:border-b [&>p]:border-border/20 [&>p]:pb-3 last:[&>p]:border-0
                    ">
                      <ReactMarkdown
                        components={{
                          a: ({...props}) => (
                            <a
                              className="inline-flex items-center gap-1 ml-auto px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary/20 font-medium text-[10px] rounded-md transition-colors"
                              target="_blank"
                              rel="noopener noreferrer"
                              {...props}
                            >
                               <ExternalLink className="w-3 h-3" /> {props.children}
                            </a>
                          )
                        }}
                      >
                        {cleanedText}
                      </ReactMarkdown>
                    </div>
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