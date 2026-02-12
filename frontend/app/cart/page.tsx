'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react'

const mockCartItems = [
  {
    id: 1,
    name: 'Galactic Glide H-12M',
    price: 18990,
    quantity: 1,
    image: '🪐',
  },
  {
    id: 2,
    name: 'Astral Trek Attire NJ-2',
    price: 15990,
    quantity: 2,
    image: '👨‍🚀',
  },
  {
    id: 3,
    name: 'Cosmic Gloves Pro',
    price: 2990,
    quantity: 1,
    image: '🔱',
  },
]

export default function CartPage() {
  const [items, setItems] = useState(mockCartItems)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(false)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = appliedCoupon ? subtotal * 0.1 : 0
  const shipping = subtotal > 50000 ? 0 : 1500
  const total = subtotal - discount + shipping

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id)
      return
    }
    setItems(items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))
  }

  const applyCoupon = () => {
    if (couponCode.trim()) {
      setAppliedCoupon(true)
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link href="/shop" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>

          <h1 className="text-4xl font-bold mb-12">
            <span className="text-neon">Shopping Cart</span>
          </h1>

          {items.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="border-border/50 bg-card/50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="text-6xl">{item.image}</div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold mb-2">{item.name}</h3>
                      <p className="text-primary font-semibold">${(item.price / 100).toFixed(2)}</p>
                    </div>

                    <div className="flex items-center border border-border/50 rounded-lg bg-card w-full sm:w-auto">
                      <button
                        className="px-3 py-2 text-muted-foreground hover:text-foreground transition"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="px-6 py-2 font-semibold min-w-[3rem] text-center">{item.quantity}</span>
                      <button
                        className="px-3 py-2 text-muted-foreground hover:text-foreground transition"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-primary mb-2">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </p>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:bg-destructive/10 p-2 rounded transition inline-flex"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="border-border/50 bg-card/50 p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>${(subtotal / 100).toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-400">
                        <span>Discount (10%)</span>
                        <span>-${(discount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? 'FREE' : `$${(shipping / 100).toFixed(2)}`}</span>
                    </div>
                    <div className="border-t border-border/30 pt-4 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">${(total / 100).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-2 bg-input border border-border/50 rounded text-sm"
                        disabled={appliedCoupon}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={applyCoupon}
                        disabled={appliedCoupon}
                        className="border-border/50 bg-transparent"
                      >
                        {appliedCoupon ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-xs text-green-400">Coupon applied successfully!</p>
                    )}
                  </div>

                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2" asChild>
                    <Link href="/checkout">
                      <ShoppingBag className="w-4 h-4" />
                      Proceed to Checkout
                    </Link>
                  </Button>

                  <Button variant="outline" className="w-full mt-3 border-border/50 bg-transparent" asChild>
                    <Link href="/shop">Continue Shopping</Link>
                  </Button>

                  <div className="mt-6 text-xs text-muted-foreground space-y-2">
                    <p>✓ Free shipping on orders over $500</p>
                    <p>✓ 30-day money-back guarantee</p>
                    <p>✓ Secure checkout</p>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link href="/shop">Start Shopping</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
