import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { useCart } from '../context/CartContext'
import { api } from '../services/api'
import { formatCurrency } from '../utils/format'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, refreshCart } = useCart()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [successOrder, setSuccessOrder] = useState(null)

  const submitCheckout = async () => {
    if (!cart.items || cart.items.length === 0) {
      setError('Your cart is empty. Add a product before checking out.')
      return
    }

    setProcessing(true)
    setError('')

    try {
      const { data } = await api.post('/api/orders/checkout/')
      setSuccessOrder(data)
      await refreshCart()
    } catch (err) {
      const message = err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Unable to complete checkout right now.'
      setError(message)
    } finally {
      setProcessing(false)
    }
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checkout</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">No items to check out</h1>
        <p className="mt-3 text-slate-600">Add a product to your cart and return here when you’re ready.</p>
        <Link to="/products" className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
          Browse products
        </Link>
      </div>
    )
  }

  if (successOrder) {
    return (
      <div className="mx-auto max-w-2xl rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Order confirmed</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-900">Thanks for your order.</h1>
        <p className="mt-3 text-slate-600">Your order #{successOrder.id} is now being processed.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/orders" className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
            View orders
          </Link>
          <Link to="/products" className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300">
            Continue shopping
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-8 pb-10 xl:grid-cols-[1.2fr_0.8fr]">
      <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Checkout</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.06em] text-slate-900">Review your order</h1>

        <div className="mt-6 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3">
              <div>
                <p className="font-semibold text-slate-900">{item.product_name}</p>
                <p className="text-sm text-slate-600">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium text-slate-900">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order summary</p>
        <div className="mt-5 space-y-3 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">{formatCurrency(cart.total_amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery</span>
            <span>Free</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxes</span>
            <span>Included</span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(cart.total_amount)}</span>
          </div>

          {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={submitCheckout}
            disabled={processing}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {processing ? <Loading message="Placing order..." /> : 'Place order'}
          </button>

          <button type="button" onClick={() => navigate('/cart')} className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
            Return to cart
          </button>
        </div>
      </aside>
    </div>
  )
}

export default CheckoutPage
