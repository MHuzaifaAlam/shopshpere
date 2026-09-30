import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CategoryPills from '../components/CategoryPills'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import ProductGrid from '../components/ProductGrid'
import { api } from '../services/api'
import { buildImageUrl, getPrimaryImage } from '../utils/format'

const normalizeCategories = (items) => {
  if (!Array.isArray(items)) {
    return []
  }

  const groups = new Map()
  items.filter((item) => item && typeof item === 'object' && (item.name || item.slug)).forEach((item) => {
    const name = item.name || item.slug
    const key = name.trim().toLocaleLowerCase()
    const existing = groups.get(key)
    if (existing) {
      existing.ids.push(item.id ?? item.slug)
      return
    }
    groups.set(key, {
      id: item.id ?? item.slug,
      ids: [item.id ?? item.slug],
      slug: item.slug ?? String(item.id ?? name),
      name: name.trim(),
      description: item.description || '',
    })
  })
  return [...groups.values()]
}

const HomePage = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get('/api/products/'),
          api.get('/api/products/categories/'),
        ])

        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : [])
        setCategories(normalizeCategories(categoriesResponse.data))
      } catch (err) {
        setError('The storefront could not load the catalog right now. Please try again shortly.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <Loading message="Loading the storefront..." />
  }

  if (error) {
    return <ErrorState message={error} actionLabel="Retry" onAction={() => window.location.reload()} />
  }

  const featuredProducts = products.slice(0, 4)
  const heroImage = buildImageUrl(getPrimaryImage(products[0]))

  return (
    <div className="space-y-10 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10 lg:p-12">
          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Premium essentials</p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.06em] text-slate-900 sm:text-5xl lg:text-6xl">
              Design-forward gear for daily life.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              ShopSphere brings together thoughtful devices, refined accessories, and everyday upgrades—all curated to feel fast, premium, and dependable.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
                Shop now
              </Link>
              <Link to="/orders" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Track orders
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-600">
              <div><span className="font-semibold text-slate-900">2-day</span> shipping</div>
              <div><span className="font-semibold text-slate-900">30-day</span> returns</div>
              <div><span className="font-semibold text-slate-900">24/7</span> support</div>
            </div>
          </div>

          <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-100 via-white to-slate-200 p-4">
            {heroImage ? (
              <img src={heroImage} alt="Featured product" className="h-full w-full rounded-[24px] object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-[24px] bg-gradient-to-br from-slate-200 to-slate-100 text-2xl font-semibold tracking-[0.2em] text-slate-500 uppercase">
                ShopSphere
              </div>
            )}
            <div className="absolute bottom-5 left-5 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Featured setup</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">Studio collection</p>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Browse categories</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Curated for every setup</h2>
          </div>
        </div>

        <CategoryPills categories={categories} selectedCategory="all" onSelect={() => {}} />
      </section>

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Featured products</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Most-loved picks</h2>
          </div>
          <Link to="/products" className="text-sm font-medium text-slate-700 transition hover:text-slate-900">
            View all products →
          </Link>
        </div>

        <ProductGrid products={featuredProducts} emptyMessage="Featured products will appear here once the catalog is loaded." />
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="grid gap-6 rounded-[30px] border border-slate-200 bg-slate-900 p-6 text-white md:grid-cols-[1.2fr_0.8fr] md:p-8"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Everyday premium</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">Built for efficiency, comfort, and clarity.</h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
            Discover thoughtfully designed tech and utility pieces that simplify your day, from desk setups to travel companions and home upgrades.
          </p>
        </div>

        <div className="flex items-end justify-center">
          <Link to="/products" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
            Explore the collection
          </Link>
        </div>
      </motion.section>
    </div>
  )
}

export default HomePage
