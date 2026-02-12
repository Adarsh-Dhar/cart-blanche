'use client'

import { Slider } from "@/components/ui/slider"
import { Wallet, Plus } from 'lucide-react' // Import Wallet and Plus icons

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { LocaleDate } from '@/components/locale-date'
import {
  CopyIcon,
  Download,
  Send,
  Eye,
  EyeOff,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  MoreVertical,
  Lock,
  Settings,
  Menu,
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'sent' | 'received'
  merchant: string
  amount: number
  timestamp: Date
  status: 'completed' | 'pending'
  txHash: string
}

export default function WalletPage() {
  const [balance, setBalance] = useState(50000) // $500.00 in cents
  const [dailyLimit, setDailyLimit] = useState(10000) // $100.00
  const [transactionLimit, setTransactionLimit] = useState(5000) // $50.00
  const [autoApprove, setAutoApprove] = useState(true)
  const [transactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'sent',
      merchant: 'Saturn Merchant LLC',
      amount: 18990,
      timestamp: new Date(Date.now() - 3600000),
      status: 'completed',
      txHash: '0x1a2b3c4d5e6f7g8h9i',
    },
    {
      id: '2',
      type: 'received',
      merchant: 'Refund - Galaxy Gate Inc',
      amount: 2500,
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed',
      txHash: '0x9i8h7g6f5e4d3c2b1a',
    },
    {
      id: '3',
      type: 'sent',
      merchant: 'Cosmic Wear Store',
      amount: 5990,
      timestamp: new Date(Date.now() - 86400000),
      status: 'completed',
      txHash: '0x2b3c4d5e6f7g8h9i1a',
    },
    {
      id: '4',
      type: 'sent',
      merchant: 'Stellar Fashion',
      amount: 12500,
      timestamp: new Date(Date.now() - 172800000),
      status: 'pending',
      txHash: '0x7g8h9i1a2b3c4d5e6f',
    },
  ])

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-neon">
            <span className="text-2xl">🚀</span>
            <span>Galactic Gateway</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/settings">Settings</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-12">
            <span className="text-neon">Wallet Dashboard</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Balance Card */}
              <Card className="border-border/50 bg-gradient-to-br from-primary/20 to-card border-l-2 border-l-primary p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Available Balance</p>
                    <h2 className="text-5xl font-bold text-neon">${(balance / 100).toFixed(2)}</h2>
                    <p className="text-sm text-muted-foreground mt-2">USDC on SKALE Network</p>
                  </div>
                  <div className="p-4 bg-primary/20 rounded-lg">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                    <Send className="w-4 h-4" />
                    Send USDC
                  </Button>
                  <Button variant="outline" className="flex-1 border-primary/50 gap-2 bg-transparent">
                    <Plus className="w-4 h-4" />
                    Add Funds
                  </Button>
                </div>
              </Card>

              {/* Spending Limits */}
              <Card className="border-border/50 bg-card/50 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Spending Controls
                  </h3>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium">Daily Spending Limit</label>
                      <span className="text-primary font-bold">${(dailyLimit / 100).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[dailyLimit]}
                      onValueChange={(val) => setDailyLimit(val[0])}
                      min={1000}
                      max={100000}
                      step={500}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Remaining today: $450.00</p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-sm font-medium">Per-Transaction Limit</label>
                      <span className="text-primary font-bold">${(transactionLimit / 100).toFixed(2)}</span>
                    </div>
                    <Slider
                      value={[transactionLimit]}
                      onValueChange={(val) => setTransactionLimit(val[0])}
                      min={500}
                      max={50000}
                      step={500}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Transactions above this require manual approval
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/30">
                    <div>
                      <p className="font-semibold text-sm">Auto-approve under limit</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically authorize transactions below threshold
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoApprove}
                      onChange={(e) => setAutoApprove(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </Card>

              {/* Transaction History */}
              <Card className="border-border/50 bg-card/50 p-6">
                <h3 className="font-bold text-lg mb-6">Transaction History</h3>

                <Tabs defaultValue="all">
                  <TabsList className="mb-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="sent">Sent</TabsTrigger>
                    <TabsTrigger value="received">Received</TabsTrigger>
                  </TabsList>

                  <TabsContent value="all" className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:border-primary/50 hover:bg-card/30 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`p-3 rounded-lg ${
                              tx.type === 'sent'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-green-500/10 text-green-400'
                            }`}
                          >
                            {tx.type === 'sent' ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{tx.merchant}</p>
                            <p className="text-xs text-muted-foreground">
                              <LocaleDate date={tx.timestamp} format="date" />
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold ${tx.type === 'sent' ? 'text-red-400' : 'text-green-400'}`}>
                              {tx.type === 'sent' ? '-' : '+'}${(tx.amount / 100).toFixed(2)}
                            </p>
                            <Badge
                              variant={tx.status === 'completed' ? 'default' : 'secondary'}
                              className="text-xs mt-1"
                            >
                              {tx.status}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="sent" className="space-y-3">
                    {transactions
                      .filter((tx) => tx.type === 'sent')
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
                              <ArrowUpRight className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{tx.merchant}</p>
                              <p className="text-xs text-muted-foreground">{tx.timestamp.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="font-bold text-red-400">-${(tx.amount / 100).toFixed(2)}</p>
                        </div>
                      ))}
                  </TabsContent>

                  <TabsContent value="received" className="space-y-3">
                    {transactions
                      .filter((tx) => tx.type === 'received')
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
                              <ArrowDownLeft className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{tx.merchant}</p>
                              <p className="text-xs text-muted-foreground">{tx.timestamp.toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="font-bold text-green-400">+${(tx.amount / 100).toFixed(2)}</p>
                        </div>
                      ))}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Network Info */}
              <Card className="border-border/50 bg-card/50 p-6">
                <h3 className="font-bold mb-4">Network Status</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Current Network</p>
                    <p className="font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      SKALE
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Alternative</p>
                    <p className="font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full" />
                      Base
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 border-border/50 bg-transparent" size="sm">
                  Switch Network
                </Button>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/50 bg-card/50 p-6">
                <h3 className="font-bold mb-4">This Month</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-red-400">$374.80</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Transactions</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Transaction</p>
                    <p className="text-2xl font-bold">$31.23</p>
                  </div>
                </div>
              </Card>

              {/* Help Card */}
              <Card className="border-border/50 bg-primary/10 border-primary/30 p-6">
                <TrendingUp className="w-6 h-6 text-primary mb-3" />
                <p className="font-semibold text-sm mb-2">Need help?</p>
                <p className="text-xs text-muted-foreground mb-4">
                  View our guides for managing your Web3 wallet and mandates.
                </p>
                <Button size="sm" variant="outline" className="w-full border-primary/50 bg-transparent">
                  View Guide
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
