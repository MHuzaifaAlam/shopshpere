import { useEffect, useMemo, useState } from 'react'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { api } from '../services/api'
import { formatCurrency } from '../utils/format'

const AdminDashboardPage = () => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seedStatus, setSeedStatus] = useState('')

  const loadDashboard = async () => {
    try {
      const [productsResponse, categoriesResponse, ordersResponse] = await Promise.all([
        api.get('/api/products/'),
        api.get('/api/products/categories/'),
        api.get('/api/orders/'),
      ])

      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : [])
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [])
      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : [])
    } catch (err) {
      setError('The admin panel could not load. Please confirm that your account has administrator access.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const metrics = useMemo(() => {
    const pendingOrders = orders.filter((order) => order.status === 'pending').length
    const processingOrders = orders.filter((order) => order.status === 'processing').length
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || order.total || 0), 0)
    const lowStockProducts = products.filter((product) => Number(product.stock || 0) <= 5).length

    return {
      totalRevenue,
      pendingOrders,
      processingOrders,
      lowStockProducts,
    }
  }, [orders, products])

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status/`, { status })
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update the order status.')
    }
  }

  const syncDemoCatalog = async () => {
    setSeedStatus('Syncing demo catalog...')

    try {
      const { data } = await api.post('/api/products/seed-demo/')
      setSeedStatus(data.message || 'Demo catalog synced successfully.')
      await loadDashboard()
    } catch (err) {
      setSeedStatus(err.response?.data?.detail || 'Unable to sync the demo catalog.')
    }
  }

  if (loading) {
    return <Loading message="Loading admin panel..." />
  }

  if (error) {
    return <ErrorState message={error} actionLabel="Try again" onAction={loadDashboard} />
  }

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Admin panel</p>
        <h2 className="mt-4 text-2xl font-semibold">Control center</h2>
        <nav className="mt-6 space-y-2">
          <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-medium text-white">Overview</div>
          <div className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-300">Orders</div>
          <div className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-300">Customers</div>
        </nav>
      </aside>

      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-900">Operations and control center</h1>
          <button
            type="button"
            onClick={syncDemoCatalog}
            className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Sync demo catalog
          </button>
          {seedStatus && <p className="mt-2 text-sm text-slate-600">{seedStatus}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(metrics.totalRevenue)}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metrics.pendingOrders}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Processing</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metrics.processingOrders}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Low stock</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metrics.lowStockProducts}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Store overview</h2>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="text-sm text-slate-600">Products</span>
                <strong className="text-lg font-semibold text-slate-900">{products.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="text-sm text-slate-600">Categories</span>
                <strong className="text-lg font-semibold text-slate-900">{categories.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="text-sm text-slate-600">Orders</span>
                <strong className="text-lg font-semibold text-slate-900">{orders.length}</strong>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span className="text-sm text-slate-600">Active catalog</span>
                <strong className="text-lg font-semibold text-slate-900">{products.filter((product) => product.is_active).length}</strong>
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Recent orders</h2>
            <div className="mt-5 space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">Order #{order.id}</p>
                      <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{order.status}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Customer</span>
                    <strong className="text-sm font-medium text-slate-900">{order.customer?.username || 'Customer'}</strong>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Amount</span>
                    <strong className="text-sm font-medium text-slate-900">{formatCurrency(order.total_amount || order.total || 0)}</strong>
                  </div>
                  <select
                    value={order.status}
                    onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                    className="mt-4 w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
