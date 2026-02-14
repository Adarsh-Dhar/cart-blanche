
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
    intent?: any;
  }

  export default function ChatPage() {
    const { signMandate } = useX402();
    const [messages, setMessages] = useState<Message[]>([
      {
        role: 'assistant',
        text: "Welcome to Cart Blanche AI Shopping Concierge! I'm here to help you find the perfect space-themed items. What are you looking for today?",
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

    // 🚨 UI CLEANER: Removes internal agent routing and repeated signatures
    const cleanMessageContent = (content: string) => {
      if (!content) return "";
      let cleaned = content.replace(/For context:\[.*?\] said:\s*/g, '');
      cleaned = cleaned.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/g, '');
      cleaned = cleaned.replace(/Here is my signature for the CartMandate:\s*0x[a-fA-F0-9]+/gi, '');
      cleaned = cleaned.replace(/0x[a-fA-F0-9]{130,}/g, '');
      return cleaned.trim();
    };

    const sendMessage = async (e?: React.FormEvent | React.KeyboardEvent, overrideText?: string) => {
      if (e) e.preventDefault();
    
      const userText = overrideText || input;
      if (!userText.trim()) return;

      // Only add to UI if it's NOT an automated background signature message
      if (!overrideText) {
        setMessages((prev) => [...prev, { role: 'user', text: userText }]);
        setInput(""); 
      }
    
      setIsLoading(true);

      try {
        await fetch(`http://127.0.0.1:8000/apps/shopping_concierge/users/${userId}/sessions/${sessionId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }).catch(err => console.warn("Session might already exist:", err));

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
              } catch (err) { }
            }
          }
        }

        // Extract EIP-712 JSON
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
           let extractedAmount = rawMsg.amount || rawMsg.total_usd || 0;
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
            
              // 🚨 THE FIX: Let the stream handle the receipt, do not hardcode a fake success UI here
              await sendMessage(undefined, `Here is my signature for the CartMandate: ${signature}`);
            
              toast({
                title: "🎉 Transaction Sent!",
                description: "Verifying your signature and settling on SKALE.",
                duration: 5000,
              });
            
            } catch (err: any) {
              console.error(err);
              setMessages((prev) => [...prev, { role: 'assistant', text: `❌ Payment signature was cancelled.` }]);
            }
          }, 500);
        }

      } catch (error: any) {
        console.error(error);
        setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ ${error.message}` }]);
      } finally {
        setIsLoading(false);
      }
    };

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

              // 🚨 AP2 TRACK RECEIPT UI 🚨
              if (message.role === 'assistant' && cleanedText.includes('Payment Complete!')) {
                // Reliably extract the Tx Hash from the markdown link generated by the backend
                const txHashMatch = cleanedText.match(/0x[a-fA-F0-9]{64}/) || cleanedText.match(/TX Hash:\s*(?:\[)?(0x[a-zA-Z0-9]+)/i);
                const txHash = txHashMatch ? (txHashMatch[1] || txHashMatch[0]) : "0xABC123...";
              
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
                          <span className="font-mono text-white">SKALE Base Sepolia</span>
                        </div>
                        <div className="flex flex-col gap-1 pt-1">
                          <span className="text-muted-foreground">Transaction Hash</span>
                          <a href={`https://base-sepolia-testnet-explorer.skalenodes.com/tx/${txHash}`} target="_blank" className="font-mono text-xs text-blue-400 truncate hover:underline bg-blue-500/10 p-1.5 rounded">
                            {txHash}
                          </a>
                        </div>
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
                          ol: ({node, ...props}) => <ol className="text-sm leading-relaxed grid grid-cols-1 gap-3 my-4 list-none p-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="text-sm leading-relaxed grid grid-cols-1 gap-3 my-4 list-none p-0" {...props} />,
                          li: ({node, ...props}) => <li className="text-sm leading-relaxed bg-background/50 border border-border rounded-xl p-4 shadow-sm" {...props} />,
                          strong: ({node, ...props}) => <strong className="text-base font-bold text-foreground block mb-2" {...props} />,
                          p: ({node, ...props}) => <p className="text-sm leading-relaxed mb-3 last:mb-0" {...props} />,
                          a: ({node, ...props}) => (
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