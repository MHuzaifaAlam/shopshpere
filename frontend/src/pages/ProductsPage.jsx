import { useEffect, useMemo, useState } from 'react'
import CategoryPills from '../components/CategoryPills'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import ProductGrid from '../components/ProductGrid'
import SearchBar from '../components/SearchBar'
import { api } from '../services/api'

const normalizeCategories = (items) => {
  if (!Array.isArray(items)) {
    return []
  }

  const groups = new Map()
  items.filter((item) => item && typeof item === 'object' && item.name).forEach((item) => {
    const key = item.name.trim().toLocaleLowerCase()
    const existing = groups.get(key)
    if (existing) {
      existing.ids.push(item.id ?? item.slug)
      return
    }
    groups.set(key, {
      id: item.id ?? item.slug,
      ids: [item.id ?? item.slug],
      slug: item.slug ?? String(item.id ?? item.name),
      name: item.name.trim(),
      description: item.description || '',
    })
  })
  return [...groups.values()]
}

const ProductsPage = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get('/api/products/'),
          api.get('/api/products/categories/'),
        ])

        setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : [])
        setCategories(normalizeCategories(categoriesResponse.data))
      } catch (err) {
        setError('The product catalog could not be loaded. Please refresh or try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCatalog()
  }, [])

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const selectedCategoryIds = categories.find((category) => String(category.id) === String(selectedCategory))?.ids || [selectedCategory]

    const nextProducts = products.filter((product) => {
      const matchesCategory = selectedCategory === 'all' || selectedCategoryIds.some((id) => String(product.category?.id ?? product.category) === String(id))
      const matchesSearch =
        !normalizedSearch ||
        product.name?.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch)

      return matchesCategory && matchesSearch
    })

    switch (sortBy) {
      case 'price-low':
        return [...nextProducts].sort((a, b) => Number(a.price) - Number(b.price))
      case 'price-high':
        return [...nextProducts].sort((a, b) => Number(b.price) - Number(a.price))
      default:
        return [...nextProducts].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    }
  }, [products, categories, searchTerm, selectedCategory, sortBy])

  if (loading) {
    return <Loading message="Loading catalog..." />
  }

  if (error) {
    return <ErrorState message={error} actionLabel="Retry" onAction={() => window.location.reload()} />
  }

  return (
    <div className="space-y-8 pb-10">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Shop</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-900">Discover refined essentials</h1>
          </div>
          <div className="w-full max-w-md">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CategoryPills categories={categories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
          <label className="flex items-center gap-3 self-start rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <span>Sort by</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="bg-transparent text-sm text-slate-700 outline-none">
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to high</option>
              <option value="price-high">Price: High to low</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'} found
          </p>
        </div>

        <ProductGrid products={filteredProducts} emptyMessage="No products match your filters. Try a broader search or a different category." />
      </section>
    </div>
  )
}

export default ProductsPage
