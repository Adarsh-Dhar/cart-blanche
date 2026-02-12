'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, CheckCircle, XCircle, FileText, Zap, Lock } from 'lucide-react'

interface Mandate {
  id: string
  type: 'intent' | 'cart' | 'payment'
  status: 'active' | 'expired' | 'completed' | 'rejected'
  merchant?: string
  items: string[]
  amount?: number
  budget?: number
  expiresAt: Date
  createdAt: Date
  signature?: string
}

export default function MandatesPage() {
  const [mandates] = useState<Mandate[]>([
    {
      id: 'INTENT-001',
      type: 'intent',
      status: 'active',
      items: ['Space Suits', 'Helmets'],
      budget: 50000,
      expiresAt: new Date(Date.now() + 3600000),
      createdAt: new Date(Date.now() - 1800000),
    },
    {
      id: 'CART-001',
      type: 'cart',
      status: 'active',
      merchant: 'Saturn Merchant LLC',
      items: ['Galactic Glide H-12M', 'Cosmic Gloves Pro'],
      amount: 21980,
      expiresAt: new Date(Date.now() + 7200000),
      createdAt: new Date(Date.now() - 900000),
    },
    {
      id: 'PAYMENT-001',
      type: 'payment',
      status: 'completed',
      merchant: 'Galaxy Gate Inc',
      items: ['Astral Trek Attire NJ-2', 'Saturn Journey Drop'],
      amount: 31980,
      expiresAt: new Date(Date.now() - 172800000),
      createdAt: new Date(Date.now() - 432000000),
      signature: '0x1a2b3c4d5e6f7g8h9i',
    },
    {
      id: 'INTENT-002',
      type: 'intent',
      status: 'expired',
      items: ['Accessories'],
      budget: 10000,
      expiresAt: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: 'PAYMENT-002',
      type: 'payment',
      status: 'completed',
      merchant: 'Stellar Fashion',
      items: ['Quantum Shield Helmet'],
      amount: 7990,
      expiresAt: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 172800000),
      signature: '0x9i8h7g6f5e4d3c2b1a',
    },
  ])

  const getMandateIcon = (type: string) => {
    switch (type) {
      case 'intent':
        return <Zap className="w-5 h-5" />
      case 'cart':
        return <FileText className="w-5 h-5" />
      case 'payment':
        return <Lock className="w-5 h-5" />
      default:
        return null
    }
  }

  const getMandateColor = (type: string, status: string) => {
    if (status === 'expired') return 'text-muted-foreground'
    if (status === 'completed') return 'text-green-400'
    switch (type) {
      case 'intent':
        return 'text-primary'
      case 'cart':
        return 'text-yellow-400'
      case 'payment':
        return 'text-green-400'
      default:
        return 'text-foreground'
    }
  }

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
              <Link href="/wallet">Wallet</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-neon">Approved Mandates</span>
          </h1>
          <p className="text-muted-foreground mb-12">
            View and manage all your Intent, Cart, and Payment mandates
          </p>

          {/* Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All Mandates</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {mandates.map((mandate) => (
                <Link key={mandate.id} href={`/mandates/${mandate.id}`}>
                  <Card className="border-border/50 bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 cursor-pointer p-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      {/* Type & ID */}
                      <div className="flex items-center gap-3">
                        <div className={`${getMandateColor(mandate.type, mandate.status)}`}>
                          {getMandateIcon(mandate.type)}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{mandate.id}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {mandate.type} Mandate
                          </p>
                        </div>
                      </div>

                      {/* Merchant & Items */}
                      <div>
                        {mandate.merchant && (
                          <p className="font-semibold text-sm">{mandate.merchant}</p>
                        )}
                        <p className="text-xs text-muted-foreground max-w-xs line-clamp-2">
                          {mandate.items.join(', ')}
                        </p>
                      </div>

                      {/* Amount/Budget */}
                      <div className="text-center">
                        {mandate.amount && (
                          <p className="font-bold text-primary">${(mandate.amount / 100).toFixed(2)}</p>
                        )}
                        {mandate.budget && (
                          <p className="text-sm text-muted-foreground">Budget: ${(mandate.budget / 100).toFixed(2)}</p>
                        )}
                      </div>

                      {/* Expiry */}
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center mb-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {Math.max(
                              0,
                              Math.floor((mandate.expiresAt.getTime() - Date.now()) / 3600000)
                            )}
                            h
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {mandate.expiresAt.toLocaleDateString()}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="text-right">
                        <Badge
                          variant={
                            mandate.status === 'active'
                              ? 'default'
                              : mandate.status === 'completed'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={`mb-2 ${
                            mandate.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : mandate.status === 'active'
                                ? 'bg-primary/20 text-primary'
                                : ''
                          }`}
                        >
                          {mandate.status === 'active' && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              Active
                            </div>
                          )}
                          {mandate.status === 'completed' && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </div>
                          )}
                          {mandate.status === 'expired' && (
                            <div className="flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Expired
                            </div>
                          )}
                        </Badge>
                        {mandate.signature && (
                          <p className="text-xs text-muted-foreground font-mono break-all">
                            {mandate.signature.slice(0, 10)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {mandates
                .filter((m) => m.status === 'active')
                .map((mandate) => (
                  <Link key={mandate.id} href={`/mandates/${mandate.id}`}>
                    <Card className="border-border/50 bg-card/50 hover:bg-card/80 cursor-pointer p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                        <div className="flex items-center gap-3">
                          <div className={`${getMandateColor(mandate.type, mandate.status)}`}>
                            {getMandateIcon(mandate.type)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{mandate.id}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {mandate.type} Mandate
                            </p>
                          </div>
                        </div>

                        <div>
                          {mandate.merchant && (
                            <p className="font-semibold text-sm">{mandate.merchant}</p>
                          )}
                          <p className="text-xs text-muted-foreground max-w-xs line-clamp-2">
                            {mandate.items.join(', ')}
                          </p>
                        </div>

                        <div className="text-center">
                          {mandate.amount && (
                            <p className="font-bold text-primary">${(mandate.amount / 100).toFixed(2)}</p>
                          )}
                          {mandate.budget && (
                            <p className="text-sm text-muted-foreground">Budget: ${(mandate.budget / 100).toFixed(2)}</p>
                          )}
                        </div>

                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center mb-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <p className="text-sm font-medium">
                              {Math.max(
                                0,
                                Math.floor((mandate.expiresAt.getTime() - Date.now()) / 3600000)
                              )}
                              h
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {mandate.expiresAt.toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <Badge className="bg-primary/20 text-primary mb-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                              Active
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {mandates
                .filter((m) => m.status === 'completed')
                .map((mandate) => (
                  <Link key={mandate.id} href={`/mandates/${mandate.id}`}>
                    <Card className="border-border/50 bg-card/50 cursor-pointer p-6">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                        <div className="flex items-center gap-3">
                          <div className={`${getMandateColor(mandate.type, mandate.status)}`}>
                            {getMandateIcon(mandate.type)}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{mandate.id}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {mandate.type} Mandate
                            </p>
                          </div>
                        </div>

                        <div>
                          {mandate.merchant && (
                            <p className="font-semibold text-sm">{mandate.merchant}</p>
                          )}
                          <p className="text-xs text-muted-foreground max-w-xs line-clamp-2">
                            {mandate.items.join(', ')}
                          </p>
                        </div>

                        <div className="text-center">
                          {mandate.amount && (
                            <p className="font-bold text-primary">${(mandate.amount / 100).toFixed(2)}</p>
                          )}
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">
                            {mandate.expiresAt.toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right">
                          <Badge className="bg-green-500/20 text-green-400 mb-2">
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Completed
                            </div>
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
            </TabsContent>

            <TabsContent value="expired" className="space-y-4">
              {mandates
                .filter((m) => m.status === 'expired')
                .map((mandate) => (
                  <Card key={mandate.id} className="border-border/50 bg-card/50 p-6 opacity-60">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
                      <div className="flex items-center gap-3">
                        <div className="text-muted-foreground">{getMandateIcon(mandate.type)}</div>
                        <div>
                          <p className="font-bold text-sm">{mandate.id}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {mandate.type} Mandate
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground max-w-xs line-clamp-2">
                          {mandate.items.join(', ')}
                        </p>
                      </div>

                      <div className="text-center">
                        {mandate.budget && (
                          <p className="text-sm text-muted-foreground">Budget: ${(mandate.budget / 100).toFixed(2)}</p>
                        )}
                      </div>

                      <div />

                      <div className="text-right">
                        <Badge variant="outline">
                          <div className="flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Expired
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>

          {/* Info Banner */}
          <Card className="border-border/50 bg-primary/10 border-primary/30 p-6 mt-12">
            <h3 className="font-bold mb-2">What are Mandates?</h3>
            <p className="text-muted-foreground text-sm">
              Mandates are cryptographic authorizations for specific transactions. Intent Mandates define your shopping
              preferences, Cart Mandates detail merchant-prepared items, and Payment Mandates complete the purchase.
              Each can be reviewed and revoked at any time.
            </p>
          </Card>
        </div>
      </div>
    </main>
  )
}
