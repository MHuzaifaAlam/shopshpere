import { Link, useNavigate } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { useCart } from '../context/CartContext'
import { formatCurrency } from '../utils/format'

const CartPage = () => {
  const navigate = useNavigate()
  const { cart, updateCartItem, removeCartItem, refreshCart } = useCart()

  const handleQuantityUpdate = async (itemId, quantity) => {
    if (quantity <= 0) {
      await removeCartItem(itemId)
      return
    }

    await updateCartItem(itemId, quantity)
  }

  if (!cart) {
    return <Loading message="Loading cart..." />
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your cart</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">Your cart is empty</h1>
        <p className="mt-3 text-slate-600">Add a few refined essentials and come back when you’re ready to check out.</p>
        <Link to="/products" className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
          Continue shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-8 pb-10 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-4">
        <h1 className="text-4xl font-semibold tracking-[-0.06em] text-slate-900">Cart</h1>

        {cart.items.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="h-24 w-full overflow-hidden rounded-2xl bg-slate-100 sm:w-28">
              {item.product_image ? (
                <img src={item.product_image} alt={item.product_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Item
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{item.product_name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{formatCurrency(item.product_price)}</p>
                </div>
                <button type="button" onClick={() => removeCartItem(item.id)} className="text-sm font-medium text-rose-600 hover:text-rose-500">
                  Remove
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <button type="button" onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full hover:bg-slate-200">
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium text-slate-800">{item.quantity}</span>
                  <button type="button" onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full hover:bg-slate-200">
                    +
                  </button>
                </div>

                <p className="text-base font-semibold text-slate-900">{formatCurrency(item.subtotal)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Summary</p>
        <div className="mt-5 space-y-4 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <span className="font-medium text-slate-900">{formatCurrency(cart.total_amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Taxes</span>
            <span>Calculated at checkout</span>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-6">
          <div className="flex items-center justify-between text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(cart.total_amount)}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Proceed to checkout
          </button>

          <button
            type="button"
            onClick={refreshCart}
            className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Refresh cart
          </button>
        </div>
      </aside>
    </div>
  )
}

export default CartPage
