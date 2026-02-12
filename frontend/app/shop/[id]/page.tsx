'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ShoppingCart, Heart, ArrowLeft, Star, Truck, Shield } from 'lucide-react'

const mockProduct = {
  id: 1,
  name: 'Galactic Glide H-12M',
  category: 'Helmets',
  price: 18990,
  originalPrice: 21990,
  rating: 4.9,
  reviews: 156,
  image: '🪐',
  description:
    'High-tech utilities suit, built for comfort and performance by Galaxy Gate Inc. This premium space suit combines cutting-edge materials with ergonomic design.',
  features: [
    'Advanced climate control technology',
    'Zero-gravity optimized design',
    'Integrated communication system',
    'Emergency life support compatibility',
    'Durable nanofiber construction',
  ],
  specs: [
    { label: 'Material', value: 'Advanced Nanofiber' },
    { label: 'Weight', value: '2.3 kg' },
    { label: 'Certification', value: 'ISA Grade A' },
    { label: 'Temperature Range', value: '-40°C to +60°C' },
  ],
  inStock: true,
  shippingInfo: 'Free shipping on orders over $5000',
  returnPolicy: '30-day money-back guarantee',
}

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  const handleAddToCart = () => {
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-card rounded-lg border border-border/50 flex items-center justify-center text-9xl overflow-hidden">
                {mockProduct.image}
                <div className="absolute top-4 right-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  Sale -14%
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-center">
              <p className="text-sm text-muted-foreground mb-3">{mockProduct.category}</p>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">{mockProduct.name}</h1>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <div className="flex gap-1">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5"
                        fill={i < Math.floor(mockProduct.rating) ? '#CDDC39' : 'none'}
                        color="#CDDC39"
                      />
                    ))}
                </div>
                <span className="text-lg font-semibold">{mockProduct.rating}</span>
                <span className="text-muted-foreground">({mockProduct.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="mb-8">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-primary">
                    ${(mockProduct.price / 100).toFixed(2)}
                  </span>
                  <span className="text-xl text-muted-foreground line-through">
                    ${(mockProduct.originalPrice / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {mockProduct.description}
              </p>

              {/* Quantity & Actions */}
              <div className="mb-8">
                <p className="text-sm font-medium mb-4">Quantity</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-border/50 rounded-lg bg-card">
                    <button
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </button>
                    <span className="px-6 py-2 font-semibold">{quantity}</span>
                    <button
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  <Button
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12"
                    onClick={handleAddToCart}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="border-border/50 px-6 bg-transparent"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Heart
                      className="w-5 h-5"
                      fill={isFavorite ? '#CDDC39' : 'none'}
                      color={isFavorite ? '#CDDC39' : 'currentColor'}
                    />
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card className="border-border/50 bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-semibold">{mockProduct.shippingInfo}</p>
                    </div>
                  </div>
                </Card>
                <Card className="border-border/50 bg-card/50 p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <div className="text-sm">
                      <p className="font-semibold">{mockProduct.returnPolicy}</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Stock Badge */}
              {mockProduct.inStock ? (
                <div className="text-green-400 font-semibold">✓ In Stock - Order now</div>
              ) : (
                <div className="text-destructive font-semibold">Out of Stock</div>
              )}
            </div>
          </div>

          {/* Features & Specs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20 pt-12 border-t border-border/30">
            <div>
              <h2 className="text-2xl font-bold mb-6">Features</h2>
              <ul className="space-y-4">
                {mockProduct.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-primary font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Specifications</h2>
              <div className="space-y-4">
                {mockProduct.specs.map((spec, i) => (
                  <div key={i} className="flex justify-between py-3 border-b border-border/30">
                    <span className="text-muted-foreground">{spec.label}</span>
                    <span className="font-semibold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Products Section */}
          <div className="mt-20 pt-12 border-t border-border/30">
            <h2 className="text-2xl font-bold mb-8">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  key={i}
                  className="border-border/50 bg-card/50 overflow-hidden hover:border-primary/50 transition cursor-pointer"
                >
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-card flex items-center justify-center text-5xl">
                    {['🛸', '⭐', '🔱', '🌟'][i - 1]}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">Premium Gear</p>
                    <h3 className="font-bold text-sm mb-2 line-clamp-2">Related Item {i}</h3>
                    <p className="text-primary font-bold">From $9,990</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
