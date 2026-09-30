import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { buildImageUrl, formatCurrency, getPrimaryImage } from '../utils/format'

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth()
  const { addToCart } = useCart()
  const imageUrl = buildImageUrl(getPrimaryImage(product))

  const handleAddToCart = async (event) => {
    event.preventDefault()

    if (!isAuthenticated) {
      window.location.href = '/login'
      return
    }

    try {
      await addToCart(product, 1)
    } catch (error) {
      console.error('Unable to add item to cart.', error)
    }
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative h-64 overflow-hidden bg-slate-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-lg font-semibold tracking-[0.2em] text-slate-400 uppercase">
              ShopSphere
            </div>
          )}

          <span className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700 backdrop-blur">
            {product.is_active ? 'In stock' : 'Sold out'}
          </span>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
              {product.category_name || 'Featured'}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
          </div>
          <span className="text-lg font-semibold text-slate-900">{formatCurrency(product.price)}</span>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-slate-600">{product.description}</p>

        <div className="flex items-center justify-between gap-3 pt-2">
          <Link
            to={`/products/${product.id}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            View details
          </Link>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.is_active}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Add to cart
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default ProductCard
