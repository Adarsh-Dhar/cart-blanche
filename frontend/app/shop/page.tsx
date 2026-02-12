'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ShoppingCart, Heart, Search, Filter, ArrowLeft } from 'lucide-react'

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: 'Astral Trek Attire NJ-2',
    category: 'Suits',
    price: 18990,
    originalPrice: 21990,
    rating: 4.8,
    reviews: 124,
    image: '👨‍🚀',
    badge: 'New',
  },
  {
    id: 2,
    name: 'Saturn Journey Drop',
    category: 'Suits',
    price: 15990,
    originalPrice: 18990,
    rating: 4.7,
    reviews: 98,
    image: '🛸',
    badge: 'Sale',
  },
  {
    id: 3,
    name: 'Galactic Glide H-12M',
    category: 'Helmets',
    price: 8990,
    originalPrice: 9990,
    rating: 4.9,
    reviews: 156,
    image: '🪐',
    badge: 'Best',
  },
  {
    id: 4,
    name: 'Nebula Explorer Suit',
    category: 'Suits',
    price: 16990,
    originalPrice: 19990,
    rating: 4.6,
    reviews: 87,
    image: '⭐',
    badge: undefined,
  },
  {
    id: 5,
    name: 'Quantum Shield Helmet',
    category: 'Helmets',
    price: 7990,
    originalPrice: 8990,
    rating: 4.8,
    reviews: 142,
    image: '🌟',
    badge: 'Sale',
  },
  {
    id: 6,
    name: 'Cosmic Gloves Pro',
    category: 'Gloves',
    price: 2990,
    originalPrice: 3490,
    rating: 4.7,
    reviews: 76,
    image: '🔱',
    badge: 'New',
  },
  {
    id: 7,
    name: 'Stellar Boots',
    category: 'Footwear',
    price: 4990,
    originalPrice: 5990,
    rating: 4.5,
    reviews: 64,
    image: '🚀',
    badge: undefined,
  },
  {
    id: 8,
    name: 'Zero-G Pack',
    category: 'Accessories',
    price: 1990,
    originalPrice: 2490,
    rating: 4.6,
    reviews: 103,
    image: '💼',
    badge: 'Sale',
  },
]

export default function ShopPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState(mockProducts)
  const [favorites, setFavorites] = useState<number[]>([])
  const [cart, setCart] = useState<number[]>([])

  const categories = ['Suits', 'Helmets', 'Gloves', 'Footwear', 'Accessories']

  useEffect(() => {
    let filtered = mockProducts

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }

    setFilteredProducts(filtered)
  }, [searchQuery, selectedCategory])

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    )
  }

  const addToCart = (id: number) => {
    setCart((prev) => [...prev, id])
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 backdrop-blur-md bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="font-bold text-xl text-neon">Galactic Gateway</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="relative">
              <ShoppingCart className="w-6 h-6 cursor-pointer hover:text-primary transition" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="text-neon">Explore Collections</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Discover our premium selection of space-inspired fashion and gear
            </p>
          </div>

          {/* Search & Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 bg-card border-border/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" className="border-border/50 gap-2 bg-transparent">
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-12 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? 'bg-primary text-primary-foreground' : 'border-border/50'}
            >
              All Products
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? 'bg-primary text-primary-foreground' : 'border-border/50'}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`}>
                <Card className="group relative overflow-hidden border-border/50 bg-card/50 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 cursor-pointer h-full">
                  {/* Product Image */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 to-card aspect-square flex items-center justify-center text-6xl">
                    {product.image}
                    {product.badge && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {product.badge}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                    <h3 className="font-bold mb-3 line-clamp-2 group-hover:text-primary transition">
                      {product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <span className="text-xs">⭐</span>
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-lg font-bold text-primary">
                        ${(product.price / 100).toFixed(2)}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${(product.originalPrice / 100).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-8"
                        onClick={(e) => {
                          e.preventDefault()
                          addToCart(product.id)
                        }}
                      >
                        <ShoppingCart className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border/50 px-3 h-8 bg-transparent"
                        onClick={(e) => {
                          e.preventDefault()
                          toggleFavorite(product.id)
                        }}
                      >
                        <Heart
                          className="w-4 h-4"
                          fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
                          color={favorites.includes(product.id) ? '#CDDC39' : 'currentColor'}
                        />
                      </Button>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(null)
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
