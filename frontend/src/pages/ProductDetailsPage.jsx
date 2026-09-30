import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { api } from '../services/api'
import { buildImageUrl, formatCurrency, getPrimaryImage } from '../utils/format'

const ProductDetailsPage = () => {
  const { productId } = useParams()
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [{ data: productData }, { data: productsData }] = await Promise.all([
          api.get(`/api/products/${productId}/`),
          api.get('/api/products/'),
        ])

        setProduct(productData)
        setRelatedProducts(
          (Array.isArray(productsData) ? productsData : []).filter(
            (item) => item.id !== productData.id && item.category === productData.category,
          ),
        )
      } catch (err) {
        setError('This product could not be loaded. It may have been removed or the catalog is temporarily unavailable.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [productId])

  const images = useMemo(() => {
    if (!product?.images) {
      return []
    }

    return product.images.map((image) => ({ ...image, url: buildImageUrl(image.image) }))
  }, [product])

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    try {
      await addToCart(product, quantity)
    } catch (err) {
      setError('Unable to add this item to your cart right now.')
    }
  }

  if (loading) {
    return <Loading message="Loading product details..." />
  }

  if (error || !product) {
    return <ErrorState message={error || 'Product not found.'} actionLabel="Back to shop" onAction={() => window.history.back()} />
  }

  const primaryImage = images[selectedImageIndex]?.url || buildImageUrl(getPrimaryImage(product))

  return (
    <div className="space-y-10 pb-10">
      <div className="grid gap-8 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100">
            {primaryImage ? (
              <img src={primaryImage} alt={product.name} className="h-[500px] w-full object-cover" />
            ) : (
              <div className="flex h-[500px] w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-2xl font-semibold tracking-[0.2em] text-slate-500 uppercase">
                ShopSphere
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`overflow-hidden rounded-2xl border ${selectedImageIndex === index ? 'border-slate-900' : 'border-slate-200'} bg-slate-100`}
                >
                  <img src={image.url} alt={`${product.name} view ${index + 1}`} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{product.category_name || 'Featured item'}</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-900">{product.name}</h1>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-3xl font-semibold text-slate-900">{formatCurrency(product.price)}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
              {product.is_active ? 'In stock' : 'Out of stock'}
            </span>
          </div>

          <p className="mt-6 text-base leading-7 text-slate-600">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <label className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-sm text-slate-600">Qty</span>
              <input
                type="number"
                min="1"
                max={product.stock || 99}
                value={quantity}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                className="w-14 border-0 bg-transparent text-center text-sm font-medium text-slate-900 outline-none"
              />
            </label>

            <button
              type="button"
              disabled={!product.is_active}
              onClick={handleAddToCart}
              className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {product.is_active ? 'Add to cart' : 'Unavailable'}
            </button>
          </div>

          <div className="mt-8 grid gap-4 border-t border-slate-200 pt-6 text-sm text-slate-600 sm:grid-cols-3">
            <div>
              <p className="text-slate-500">Availability</p>
              <p className="mt-1 font-medium text-slate-900">{product.stock} units</p>
            </div>
            <div>
              <p className="text-slate-500">Category</p>
              <p className="mt-1 font-medium text-slate-900">{product.category_name || 'General'}</p>
            </div>
            <div>
              <p className="text-slate-500">Delivery</p>
              <p className="mt-1 font-medium text-slate-900">Ships in 2-4 days</p>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-900">Related products</h2>
            <Link to="/products" className="text-sm font-medium text-slate-700 hover:text-slate-900">Browse all</Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {relatedProducts.slice(0, 4).map((relatedProduct) => (
              <Link key={relatedProduct.id} to={`/products/${relatedProduct.id}`} className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                <div className="h-48 overflow-hidden bg-slate-100">
                  {buildImageUrl(getPrimaryImage(relatedProduct)) ? (
                    <img src={buildImageUrl(getPrimaryImage(relatedProduct))} alt={relatedProduct.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      ShopSphere
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="text-lg font-semibold text-slate-900">{relatedProduct.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">{formatCurrency(relatedProduct.price)}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">More</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductDetailsPage
