import { useEffect, useState } from 'react'
import { formatCurrency } from '../utils/format'
import { api } from '../services/api'
import Loading from '../components/Loading'
import ErrorState from '../components/ErrorState'

const OrdersPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/api/orders/')
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('We could not load your order history at the moment.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const cancelOrder = async (orderId) => {
    try {
      await api.post(`/api/orders/${orderId}/cancel/`)
      await fetchOrders()
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'This order cannot be cancelled right now.')
    }
  }

  if (loading) {
    return <Loading message="Loading your orders..." />
  }

  if (error) {
    return <ErrorState message={error} actionLabel="Retry" onAction={fetchOrders} />
  }

  if (!orders.length) {
    return (
      <div className="mx-auto max-w-lg rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Orders</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-900">No orders yet</h1>
        <p className="mt-3 text-slate-600">Your completed purchases will appear here once you’ve placed your first order.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Orders</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-900">Order history</h1>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order #{order.id}</p>
              <p className="mt-1 text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.16em] text-slate-700">
                {order.status}
              </span>
              {order.status === 'pending' && (
                <button type="button" onClick={() => cancelOrder(order.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100">
                  Cancel order
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{item.product_name || `Product #${item.product}`}</p>
                  <p className="text-slate-600">Qty: {item.quantity}</p>
                </div>
                <span className="font-medium text-slate-900">{formatCurrency(item.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-600">
            <span>Total</span>
            <span className="text-base font-semibold text-slate-900">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default OrdersPage
