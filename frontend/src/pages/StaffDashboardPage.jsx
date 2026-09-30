import { useEffect, useState } from 'react'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { api } from '../services/api'
import { buildImageUrl, formatCurrency } from '../utils/format'

const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  slug: '',
  is_active: true,
}
const emptyCategoryForm = { name: '', slug: '', description: '' }

const StaffDashboardPage = () => {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [categories, setCategories] = useState([])
  const [customers, setCustomers] = useState([])
  const [permissions, setPermissions] = useState({})
  const [form, setForm] = useState(emptyProductForm)
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm)
  const [productImage, setProductImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const loadDashboard = async () => {
    setError('')
    try {
      const { data: dashboard } = await api.get('/api/staff/dashboard/')
      const [productsResponse, categoriesResponse, ordersResponse, customersResponse] = await Promise.all([
        api.get('/api/products/'),
        api.get('/api/products/categories/'),
        dashboard.permissions['orders.view_order'] ? api.get('/api/orders/') : Promise.resolve({ data: [] }),
        dashboard.permissions['accounts.view_customers'] ? api.get('/api/staff/customers/') : Promise.resolve({ data: [] }),
      ])

      setPermissions(dashboard.permissions || {})
      setProducts(Array.isArray(productsResponse.data) ? productsResponse.data : [])
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [])
      setOrders(Array.isArray(ordersResponse.data) ? ordersResponse.data : [])
      setCustomers(Array.isArray(customersResponse.data) ? customersResponse.data : [])
    } catch (err) {
      setError(err.response?.data?.detail || 'The staff dashboard could not load. Please confirm your account is active and has staff access.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    try {
      const { data: product } = await api.post('/api/products/', {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        category: Number(form.category),
      })

      if (productImage) {
        const imageData = new FormData()
        imageData.append('product', product.id)
        imageData.append('image', productImage)
        imageData.append('alt_text', form.name)
        imageData.append('is_primary', 'true')

        try {
          await api.post('/api/products/images/', imageData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (imageError) {
          const detail = imageError.response?.data?.detail || Object.values(imageError.response?.data || {}).flat()[0]
          setFormError(`Product created, but image upload failed: ${detail || 'Please try again.'}`)
          setForm(emptyProductForm)
          setProductImage(null)
          await loadDashboard()
          return
        }
      }

      setForm(emptyProductForm)
      setProductImage(null)
      await loadDashboard()
    } catch (err) {
      const detail = err.response?.data?.detail || Object.values(err.response?.data || {}).flat()[0]
      setFormError(detail || 'Unable to create the product.')
    }
  }

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product? Products in existing orders cannot be removed.')) return
    try {
      await api.delete(`/api/products/${productId}/`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete the product.')
    }
  }

  const uploadProductImage = async (product, image) => {
    if (!image) return
    const imageData = new FormData()
    imageData.append('product', product.id)
    imageData.append('image', image)
    imageData.append('alt_text', product.name)
    imageData.append('is_primary', product.images?.length ? 'false' : 'true')
    try {
      await api.post('/api/products/images/', imageData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || Object.values(err.response?.data || {}).flat()[0] || 'Unable to upload product image.')
    }
  }

  const updateProductImage = async (image, changes) => {
    try {
      await api.patch(`/api/products/images/${image.id}/`, changes)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update product image.')
    }
  }

  const deleteProductImage = async (image) => {
    if (!window.confirm('Remove this product image?')) return
    try {
      await api.delete(`/api/products/images/${image.id}/`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to remove product image.')
    }
  }

  const saveProduct = async (product) => {
    try {
      await api.patch(`/api/products/${product.id}/`, {
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        is_active: product.is_active,
      })
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update the product.')
    }
  }

  const createCategory = async (event) => {
    event.preventDefault()
    try {
      await api.post('/api/products/categories/', categoryForm)
      setCategoryForm(emptyCategoryForm)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || Object.values(err.response?.data || {}).flat()[0] || 'Unable to create category.')
    }
  }

  const saveCategory = async (category) => {
    try {
      await api.patch(`/api/products/categories/${category.id}/`, category)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update category.')
    }
  }

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete ${category.name} and its products?`)) return
    try {
      await api.delete(`/api/products/categories/${category.id}/`)
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to delete category.')
    }
  }

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/api/orders/${orderId}/status/`, { status })
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update the order status.')
    }
  }

  const updateCustomerStatus = async (customer) => {
    if (!window.confirm(`${customer.is_active ? 'Deactivate' : 'Activate'} ${customer.username}?`)) return
    try {
      await api.patch(`/api/staff/customers/${customer.id}/`, { is_active: !customer.is_active })
      await loadDashboard()
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to update this customer account.')
    }
  }

  if (loading) {
    return <Loading message="Loading staff dashboard..." />
  }

  if (error) {
    return <ErrorState message={error} actionLabel="Try again" onAction={loadDashboard} />
  }

  return (
    <div className="grid gap-6 pb-10 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-[28px] border border-slate-200 bg-slate-900 p-5 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Staff panel</p>
        <h2 className="mt-4 text-2xl font-semibold">Operations</h2>
        <nav className="mt-6 space-y-2">
          <a href="#overview" className="block rounded-md bg-white/10 px-3 py-2 text-sm font-medium text-white">Overview</a>
          {(permissions['products.view_product'] || permissions['products.add_product']) && <a href="#inventory" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10">Inventory</a>}
          {(permissions['products.view_categeory'] || permissions['products.add_categeory'] || permissions['products.change_categeory'] || permissions['products.delete_categeory']) && <a href="#categories" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10">Categories</a>}
          {permissions['orders.view_order'] && <a href="#orders" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10">Orders</a>}
          {permissions['accounts.view_customers'] && <a href="#customers" className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10">Customers</a>}
        </nav>
      </aside>

      <div className="space-y-8">
        <div id="overview">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Staff dashboard</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.06em] text-slate-900">Inventory & order operations</h1>
        </div>

        <div id="inventory" className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          {permissions['products.add_product'] && (
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Create product</h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Product name</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400 focus:bg-white" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Slug</label>
                <input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400 focus:bg-white" required />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400 focus:bg-white" required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Price</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400 focus:bg-white" required />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400 focus:bg-white" required />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-slate-400 focus:bg-white" required>
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {permissions['products.add_productimage'] && <div>
                <label htmlFor="product-image" className="mb-2 block text-sm font-medium text-slate-700">Product image</label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setProductImage(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                />
                {productImage && <p className="mt-2 text-xs text-slate-500">Selected: {productImage.name}</p>}
              </div>}

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
                Active product
              </label>

              <button type="submit" className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700">
                Save product
              </button>
              {formError && <p role="alert" className="text-sm text-rose-700">{formError}</p>}
            </form>
          </section>
          )}

          {permissions['products.view_product'] && (
          <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Catalog</h2>
            <div className="mt-5 space-y-4">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_90px_100px_auto] sm:items-center">
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-600">{formatCurrency(product.price)} · {product.stock} in stock</p>
                    </div>
                    {permissions['products.change_product'] && <>
                      <input aria-label={`${product.name} price`} type="number" min="0" step="0.01" value={product.price} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, price: event.target.value } : item))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <input aria-label={`${product.name} stock`} type="number" min="0" value={product.stock} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, stock: Number(event.target.value) } : item))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                      <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={product.is_active} onChange={(event) => setProducts((current) => current.map((item) => item.id === product.id ? { ...item, is_active: event.target.checked } : item))} />Active</label>
                      <button type="button" onClick={() => saveProduct(product)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs">Save</button>
                    </>}
                    <div className="flex gap-2">
                      {permissions['products.delete_product'] && (
                      <button type="button" onClick={() => deleteProduct(product.id)} className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100">
                        Delete
                      </button>
                      )}
                    </div>
                  </div>
                  {(permissions['products.view_productimage'] || permissions['products.add_productimage'] || permissions['products.change_productimage'] || permissions['products.delete_productimage']) && (
                    <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                      {permissions['products.view_productimage'] && (product.images || []).map((image) => (
                        <div key={image.id} className="flex items-center gap-2">
                          <img src={buildImageUrl(image.image)} alt={image.alt_text || product.name} className="h-12 w-12 rounded object-cover" />
                          {permissions['products.change_productimage'] && <>
                            <input aria-label={`Alt text for ${product.name}`} defaultValue={image.alt_text} onBlur={(event) => event.target.value !== image.alt_text && updateProductImage(image, { alt_text: event.target.value })} className="w-32 rounded border border-slate-200 px-2 py-1 text-xs" />
                            <label className="flex items-center gap-1 text-xs"><input type="radio" name={`staff-primary-image-${product.id}`} checked={image.is_primary} onChange={() => updateProductImage(image, { is_primary: true })} />Primary</label>
                          </>}
                          {permissions['products.delete_productimage'] && <button type="button" onClick={() => deleteProductImage(image)} className="text-xs text-rose-700">Remove</button>}
                        </div>
                      ))}
                      {permissions['products.add_productimage'] && <label className="flex cursor-pointer items-center rounded border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-600">
                        Add image
                        <input type="file" accept="image/*" className="sr-only" onChange={(event) => { uploadProductImage(product, event.target.files?.[0]); event.target.value = '' }} />
                      </label>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
          )}
        </div>

        {(permissions['products.view_categeory'] || permissions['products.add_categeory'] || permissions['products.change_categeory'] || permissions['products.delete_categeory']) && <section id="categories" className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Categories</h2>
          {permissions['products.add_categeory'] && <form onSubmit={createCategory} className="mt-4 grid gap-3 md:grid-cols-3">
            <input aria-label="New category name" placeholder="Category name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required className="rounded-lg border border-slate-200 px-3 py-2" />
            <input aria-label="New category slug" placeholder="Slug" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} required className="rounded-lg border border-slate-200 px-3 py-2" />
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">Add category</button>
            <textarea aria-label="Category description" placeholder="Description" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} className="rounded-lg border border-slate-200 px-3 py-2 md:col-span-3" />
          </form>}
          <div className="mt-4 space-y-3">
            {permissions['products.view_categeory'] && categories.map((category) => <div key={category.id} className="grid gap-2 border-t border-slate-100 pt-3 md:grid-cols-[1fr_1fr_2fr_auto_auto]">
              <input aria-label={`${category.name} name`} value={category.name} readOnly={!permissions['products.change_categeory']} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item))} className="rounded border border-slate-200 px-2 py-2" />
              <input aria-label={`${category.name} slug`} value={category.slug} readOnly={!permissions['products.change_categeory']} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, slug: event.target.value } : item))} className="rounded border border-slate-200 px-2 py-2" />
              <input aria-label={`${category.name} description`} value={category.description || ''} readOnly={!permissions['products.change_categeory']} onChange={(event) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, description: event.target.value } : item))} className="rounded border border-slate-200 px-2 py-2" />
              {permissions['products.change_categeory'] && <button type="button" onClick={() => saveCategory(category)} className="rounded border border-slate-300 px-3 py-2 text-sm">Save</button>}
              {permissions['products.delete_categeory'] && <button type="button" onClick={() => deleteCategory(category)} className="rounded border border-rose-200 px-3 py-2 text-sm text-rose-700">Delete</button>}
            </div>)}
          </div>
        </section>}

        {permissions['orders.view_order'] && (
        <section id="orders" className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Recent orders</h2>
          <div className="mt-5 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Order #{order.id}</p>
                    <p className="text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()} · {order.status}</p>
                  </div>
                  {permissions['orders.change_order'] && <select
                    value={order.status}
                    onChange={(event) => updateOrderStatus(order.id, event.target.value)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                  >
                    <option value={order.status}>{order.status}</option>
                    {(order.status === 'pending' ? ['processing', 'cancelled'] : order.status === 'processing' ? ['shipped'] : order.status === 'shipped' ? ['delivered'] : []).map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>}
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {permissions['accounts.view_customers'] && (
          <section id="customers" className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Customers</h2>
            <div className="mt-5 divide-y divide-slate-200">
              {customers.map((customer) => (
                <div key={customer.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{customer.username}</p>
                    <p className="text-sm text-slate-600">{customer.email || 'No email'} · {customer.is_active ? 'Active' : 'Disabled'}</p>
                  </div>
                  {permissions['accounts.change_customers'] && (
                    <button type="button" onClick={() => updateCustomerStatus(customer)} className="rounded-full border border-slate-300 px-3 py-2 text-sm text-slate-700">
                      {customer.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default StaffDashboardPage
