import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import Loading from '../components/Loading'
import { api } from '../services/api'
import { buildImageUrl, formatCurrency } from '../utils/format'

const sections = [
  ['dashboard', 'Overview'],
  ['staff', 'Staff & permissions'],
  ['groups', 'Permission groups'],
  ['customers', 'Customers'],
  ['products', 'Products'],
  ['categories', 'Categories'],
  ['orders', 'Orders'],
]

const emptyProduct = { name: '', slug: '', description: '', price: '', stock: '', category: '', is_active: true }
const emptyCategory = { name: '', slug: '', description: '' }

const AdminManagementPage = () => {
  const location = useLocation()
  const activeSection = location.pathname.split('/')[2] || 'dashboard'
  const [data, setData] = useState({ dashboard: null, staff: [], groups: [], permissions: [], customers: [], products: [], categories: [], orders: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [staffForm, setStaffForm] = useState({ username: '', email: '', password: '' })
  const [staffPermissions, setStaffPermissions] = useState([])
  const [staffGroups, setStaffGroups] = useState([])
  const [groupForm, setGroupForm] = useState({ name: '', permissions: [] })
  const [groupPermissions, setGroupPermissions] = useState({})
  const [productForm, setProductForm] = useState(emptyProduct)
  const [productImage, setProductImage] = useState(null)
  const [categoryForm, setCategoryForm] = useState(emptyCategory)
  const [customerDetail, setCustomerDetail] = useState(null)

  const loadData = async () => {
    setError('')
    try {
      const [dashboard, staff, groups, permissions, customers, products, categories, orders] = await Promise.all([
        api.get('/api/admin/dashboard/'),
        api.get('/api/admin/staff/'),
        api.get('/api/admin/groups/'),
        api.get('/api/admin/staff/permissions/'),
        api.get('/api/admin/customers/'),
        api.get('/api/products/'),
        api.get('/api/products/categories/'),
        api.get('/api/orders/'),
      ])
      const nextGroups = Array.isArray(groups.data) ? groups.data : []
      setData({
        dashboard: dashboard.data,
        staff: Array.isArray(staff.data) ? staff.data : [],
        groups: nextGroups,
        permissions: Array.isArray(permissions.data) ? permissions.data : [],
        customers: Array.isArray(customers.data) ? customers.data : [],
        products: Array.isArray(products.data) ? products.data : [],
        categories: Array.isArray(categories.data) ? categories.data : [],
        orders: Array.isArray(orders.data) ? orders.data : [],
      })
      setGroupPermissions(Object.fromEntries(nextGroups.map((group) => [group.id, group.permissions || []])))
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'The management data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const report = (message) => {
    setNotice(message)
    setError('')
  }

  const toggleId = (values, id) => values.includes(id) ? values.filter((value) => value !== id) : [...values, id]

  const createStaff = async (event) => {
    event.preventDefault()
    try {
      await api.post('/api/admin/staff/', { ...staffForm, is_active: true, permissions: staffPermissions, groups: staffGroups })
      setStaffForm({ username: '', email: '', password: '' })
      setStaffPermissions([])
      setStaffGroups([])
      report('Staff account created with the selected access.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || Object.values(requestError.response?.data || {}).flat()[0] || 'Unable to create staff account.')
    }
  }

  const saveStaff = async (staff) => {
    try {
      await api.patch(`/api/admin/staff/${staff.id}/`, { permissions: staff.permissions, groups: staff.groups, is_active: staff.is_active })
      report(`Access updated for ${staff.username}.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update staff access.')
    }
  }

  const createGroup = async (event) => {
    event.preventDefault()
    try {
      await api.post('/api/admin/groups/', groupForm)
      setGroupForm({ name: '', permissions: [] })
      report('Permission group created.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to create permission group.')
    }
  }

  const saveGroup = async (group) => {
    try {
      await api.patch(`/api/admin/groups/${group.id}/`, { name: group.name, permissions: groupPermissions[group.id] || [] })
      report(`Permissions saved for ${group.name}.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update permission group.')
    }
  }

  const deactivateStaff = async (staff) => {
    if (!window.confirm(`Disable ${staff.username}? Their account history will be retained.`)) return
    try {
      await api.delete(`/api/admin/staff/${staff.id}/`)
      report(`${staff.username} has been disabled.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to disable staff account.')
    }
  }

  const toggleCustomer = async (customer) => {
    try {
      await api.patch(`/api/admin/customers/${customer.id}/`, { is_active: !customer.is_active })
      report(`Customer ${customer.username} ${customer.is_active ? 'deactivated' : 'activated'}.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update customer account.')
    }
  }

  const showCustomer = async (customerId) => {
    try {
      const { data: customer } = await api.get(`/api/admin/customers/${customerId}/`)
      setCustomerDetail(customer)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load customer details.')
    }
  }

  const createProduct = async (event) => {
    event.preventDefault()
    try {
      const { data: product } = await api.post('/api/products/', {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        category: Number(productForm.category),
      })
      if (productImage) {
        const upload = new FormData()
        upload.append('product', product.id)
        upload.append('image', productImage)
        upload.append('alt_text', productForm.name)
        upload.append('is_primary', 'true')
        await api.post('/api/products/images/', upload, { headers: { 'Content-Type': 'multipart/form-data' } })
      }
      setProductForm(emptyProduct)
      setProductImage(null)
      report('Product saved to the catalog.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || Object.values(requestError.response?.data || {}).flat()[0] || 'Unable to create the product.')
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
      report(`${product.name} updated.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || Object.values(requestError.response?.data || {}).flat()[0] || 'Unable to update the product.')
    }
  }

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? Products in existing orders are protected and cannot be deleted.`)) return
    try {
      await api.delete(`/api/products/${product.id}/`)
      report(`${product.name} deleted.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to delete this product.')
    }
  }

  const uploadProductImage = async (product, image) => {
    if (!image) return
    const upload = new FormData()
    upload.append('product', product.id)
    upload.append('image', image)
    upload.append('alt_text', product.name)
    upload.append('is_primary', product.images?.length ? 'false' : 'true')
    try {
      await api.post('/api/products/images/', upload, { headers: { 'Content-Type': 'multipart/form-data' } })
      report(`Image uploaded for ${product.name}.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || Object.values(requestError.response?.data || {}).flat()[0] || 'Unable to upload image.')
    }
  }

  const updateProductImage = async (image, changes) => {
    try {
      await api.patch(`/api/products/images/${image.id}/`, changes)
      report('Product image updated.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || Object.values(requestError.response?.data || {}).flat()[0] || 'Unable to update image.')
    }
  }

  const deleteProductImage = async (image) => {
    if (!window.confirm('Remove this product image?')) return
    try {
      await api.delete(`/api/products/images/${image.id}/`)
      report('Product image removed.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to remove image.')
    }
  }

  const createCategory = async (event) => {
    event.preventDefault()
    try {
      await api.post('/api/products/categories/', categoryForm)
      setCategoryForm(emptyCategory)
      report('Category created.')
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || Object.values(requestError.response?.data || {}).flat()[0] || 'Unable to create category.')
    }
  }

  const saveCategory = async (category) => {
    try {
      await api.patch(`/api/products/categories/${category.id}/`, { name: category.name, slug: category.slug, description: category.description })
      report(`${category.name} updated.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to update category.')
    }
  }

  const deleteCategory = async (category) => {
    if (!window.confirm(`Delete ${category.name}? Products in this category will also be deleted.`)) return
    try {
      await api.delete(`/api/products/categories/${category.id}/`)
      report(`${category.name} deleted.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to delete this category.')
    }
  }

  const updateOrderStatus = async (order, status) => {
    try {
      await api.patch(`/api/orders/${order.id}/status/`, { status })
      report(`Order #${order.id} updated.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'The order status transition was rejected.')
    }
  }

  const syncDemoCatalog = async () => {
    try {
      const { data: result } = await api.post('/api/products/seed-demo/')
      report(`${result.message} ${result.created} added, ${result.updated} refreshed.`)
      await loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to sync the demo catalog.')
    }
  }

  const patchRecord = (collection, id, changes) => {
    setData((current) => ({ ...current, [collection]: current[collection].map((item) => item.id === id ? { ...item, ...changes } : item) }))
  }

  if (loading) return <Loading message="Loading admin control center..." />
  if (error && !data.dashboard) return <ErrorState message={error} actionLabel="Retry" onAction={loadData} />

  const dashboard = data.dashboard || {}
  const metric = (label, value) => (
    <div key={label} className="border-l-2 border-emerald-600 pl-4 py-1">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  )
  const permissionLabel = (permission) => permission.name.replace(/^(Can )?/, '')
  const statusChoices = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  }
  const updateListRecord = (collection, id, field, value) => patchRecord(collection, id, { [field]: value })

  return (
    <div className="grid gap-5 pb-10 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="h-fit rounded-lg bg-slate-950 p-5 text-white lg:sticky lg:top-6">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">ShopSphere</p>
        <h2 className="mt-3 text-xl font-semibold">Administration</h2>
        <nav className="mt-6 space-y-1" aria-label="Admin sections">
          {sections.map(([path, label]) => (
            <Link key={path} to={path === 'dashboard' ? '/admin' : `/admin/${path}`} className={`block rounded-md px-3 py-2.5 text-sm transition ${activeSection === path ? 'bg-emerald-700 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Superuser workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">{sections.find(([path]) => path === activeSection)?.[1] || 'Overview'}</h1>
          </div>
          <button type="button" onClick={loadData} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white">Refresh data</button>
        </header>
        {notice && <p role="status" className="border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p>}
        {error && <p role="alert" className="border-l-4 border-rose-600 bg-rose-50 px-4 py-3 text-sm text-rose-900">{error}</p>}

        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <section className="grid gap-5 border-b border-slate-200 pb-6 sm:grid-cols-2 xl:grid-cols-4">
              {metric('Customers', dashboard.customers ?? 0)}
              {metric('Staff', dashboard.staff ?? 0)}
              {metric('Products', dashboard.products ?? 0)}
              {metric('Active products', dashboard.active_products ?? 0)}
              {metric('Out of stock', dashboard.out_of_stock_products ?? 0)}
              {metric('Categories', dashboard.categories ?? 0)}
              {metric('Orders', dashboard.orders ?? 0)}
              {metric('Delivered sales', formatCurrency(dashboard.delivered_revenue))}
            </section>
            <section className="grid gap-6 xl:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Order status</h2>
                <dl className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                  {Object.entries(dashboard.order_statuses || {}).map(([label, count]) => <div key={label} className="flex justify-between py-2.5 text-sm"><dt className="capitalize text-slate-600">{label}</dt><dd className="font-semibold text-slate-900">{count}</dd></div>)}
                </dl>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Low stock</h2>
                <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                  {(dashboard.low_stock_products || []).map((product) => <div key={product.id} className="flex justify-between gap-4 py-2.5 text-sm"><span className="truncate">{product.name}</span><span className="font-semibold text-rose-700">{product.stock} left</span></div>)}
                </div>
              </div>
            </section>
            <div className="flex flex-wrap gap-3">
              <Link to="/admin/orders" className="rounded-md bg-slate-950 px-4 py-2.5 text-sm font-medium text-white">Review orders</Link>
              <button type="button" onClick={syncDemoCatalog} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700">Sync demo catalog</button>
            </div>
          </div>
        )}

        {activeSection === 'staff' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold">Create staff account</h2>
              <form onSubmit={createStaff} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <input aria-label="Username" placeholder="Username" value={staffForm.username} onChange={(event) => setStaffForm({ ...staffForm, username: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
                <input aria-label="Email" type="email" placeholder="Email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} className="rounded-md border border-slate-300 px-3 py-2.5" />
                <input aria-label="Temporary password" type="password" placeholder="Temporary password" value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} required minLength={8} className="rounded-md border border-slate-300 px-3 py-2.5" />
                <select aria-label="Permission group" multiple value={staffGroups.map(String)} onChange={(event) => setStaffGroups(Array.from(event.target.selectedOptions, (option) => Number(option.value)))} className="min-h-20 rounded-md border border-slate-300 px-3 py-2.5 sm:col-span-2">
                  {data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                </select>
                <div className="flex items-center"><button className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Create staff</button></div>
                <fieldset className="space-y-2 border-t border-slate-200 pt-4 sm:col-span-2 xl:col-span-3">
                  <legend className="mb-2 text-sm font-semibold">Direct permissions</legend>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {data.permissions.map((permission) => <label key={permission.id} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={staffPermissions.includes(permission.id)} onChange={() => setStaffPermissions(toggleId(staffPermissions, permission.id))} /><span>{permissionLabel(permission)}</span></label>)}
                  </div>
                </fieldset>
              </form>
            </section>
            <section>
              <h2 className="text-lg font-semibold">Staff access</h2>
              <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {data.staff.map((staff) => (
                  <article key={staff.id} className="py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div><h3 className="font-semibold">{staff.username}</h3><p className="text-sm text-slate-500">{staff.email || 'No email'} · {staff.is_active ? 'Active' : 'Disabled'}</p></div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => patchRecord('staff', staff.id, { is_active: !staff.is_active })} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{staff.is_active ? 'Disable' : 'Enable'}</button>
                        <button type="button" onClick={() => saveStaff(staff)} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white">Save access</button>
                        <button type="button" onClick={() => deactivateStaff(staff)} className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700">Disable account</button>
                      </div>
                    </div>
                    <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">Groups</label>
                    <select multiple value={(staff.groups || []).map(String)} onChange={(event) => patchRecord('staff', staff.id, { groups: Array.from(event.target.selectedOptions, (option) => Number(option.value)) })} className="mt-1 min-h-16 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                      {data.groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
                    </select>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {data.permissions.map((permission) => <label key={permission.id} className="flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={(staff.permissions || []).includes(permission.id)} onChange={() => patchRecord('staff', staff.id, { permissions: toggleId(staff.permissions || [], permission.id) })} /><span>{permissionLabel(permission)}</span></label>)}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeSection === 'groups' && (
          <div className="space-y-6">
            <form onSubmit={createGroup} className="space-y-4 border-b border-slate-200 pb-6">
              <h2 className="text-lg font-semibold">Create permission group</h2>
              <input aria-label="Group name" placeholder="Group name" value={groupForm.name} onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })} required className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2.5" />
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {data.permissions.map((permission) => <label key={permission.id} className="flex gap-2 text-sm"><input type="checkbox" checked={groupForm.permissions.includes(permission.id)} onChange={() => setGroupForm({ ...groupForm, permissions: toggleId(groupForm.permissions, permission.id) })} />{permissionLabel(permission)}</label>)}
              </div>
              <button className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">Create group</button>
            </form>
            <section className="divide-y divide-slate-200 border-y border-slate-200">
              {data.groups.map((group) => (
                <article key={group.id} className="space-y-3 py-5">
                  <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">{group.name}</h3><button type="button" onClick={() => saveGroup(group)} className="rounded-md bg-slate-950 px-3 py-2 text-sm text-white">Save permissions</button></div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{data.permissions.map((permission) => <label key={permission.id} className="flex gap-2 text-sm"><input type="checkbox" checked={(groupPermissions[group.id] || []).includes(permission.id)} onChange={() => setGroupPermissions({ ...groupPermissions, [group.id]: toggleId(groupPermissions[group.id] || [], permission.id) })} />{permissionLabel(permission)}</label>)}</div>
                </article>
              ))}
            </section>
          </div>
        )}

        {activeSection === 'customers' && (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
            <section>
              <h2 className="text-lg font-semibold">Customer accounts</h2>
              <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {data.customers.map((customer) => <div key={customer.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-semibold">{customer.username}</p><p className="text-sm text-slate-500">{customer.email || 'No email'} · {customer.is_active ? 'Active' : 'Disabled'}</p></div><div className="flex gap-2"><button type="button" onClick={() => showCustomer(customer.id)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Details</button><button type="button" onClick={() => toggleCustomer(customer)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">{customer.is_active ? 'Deactivate' : 'Activate'}</button></div></div>)}
              </div>
            </section>
            {customerDetail && <aside className="h-fit border-l-2 border-emerald-600 pl-5"><div className="flex justify-between gap-2"><h2 className="font-semibold">{customerDetail.username}</h2><button type="button" onClick={() => setCustomerDetail(null)} aria-label="Close customer details">Close</button></div><p className="mt-1 text-sm text-slate-500">{customerDetail.email}</p><h3 className="mt-5 text-sm font-semibold">Order history</h3><div className="mt-2 divide-y divide-slate-200">{(customerDetail.orders || []).map((order) => <div key={order.id} className="py-3 text-sm"><p>Order #{order.id} · {order.status}</p><p className="text-slate-500">{formatCurrency(order.total_amount)} · {new Date(order.created_at).toLocaleDateString()}</p></div>)}</div></aside>}
          </div>
        )}

        {activeSection === 'products' && (
          <div className="space-y-7">
            <form onSubmit={createProduct} className="grid gap-3 border-b border-slate-200 pb-6 sm:grid-cols-2 xl:grid-cols-3">
              <h2 className="text-lg font-semibold sm:col-span-2 xl:col-span-3">Add product</h2>
              <input aria-label="Product name" placeholder="Name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
              <input aria-label="Product slug" placeholder="Slug" value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
              <input aria-label="Price" type="number" min="0" step="0.01" placeholder="Price" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
              <input aria-label="Stock" type="number" min="0" placeholder="Stock" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
              <select aria-label="Category" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5"><option value="">Select category</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
              <input aria-label="Product image" type="file" accept="image/*" onChange={(event) => setProductImage(event.target.files?.[0] || null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
              <textarea aria-label="Description" placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} required className="min-h-24 rounded-md border border-slate-300 px-3 py-2.5 sm:col-span-2" />
              <button className="self-start rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">Create product</button>
            </form>
            <section className="divide-y divide-slate-200 border-y border-slate-200">
              {data.products.map((product) => <article key={product.id} className="py-4">
                <div className="grid gap-3 md:grid-cols-[72px_minmax(0,1fr)_120px_100px_130px_auto] md:items-center">
                {product.images?.[0]?.image ? <img src={buildImageUrl(product.images.find((image) => image.is_primary)?.image || product.images[0].image)} alt={product.name} className="h-16 w-16 rounded-md object-cover" /> : <div aria-label="No image" className="h-16 w-16 rounded-md bg-slate-100" />}
                <div className="min-w-0"><input aria-label={`${product.name} name`} value={product.name} onChange={(event) => updateListRecord('products', product.id, 'name', event.target.value)} className="w-full rounded border border-slate-200 px-2 py-1 font-semibold" /><p className="mt-1 text-xs text-slate-500">{product.slug}</p></div>
                <input aria-label={`${product.name} price`} type="number" min="0" step="0.01" value={product.price} onChange={(event) => updateListRecord('products', product.id, 'price', event.target.value)} className="rounded border border-slate-200 px-2 py-1" />
                <input aria-label={`${product.name} stock`} type="number" min="0" value={product.stock} onChange={(event) => updateListRecord('products', product.id, 'stock', event.target.value)} className="rounded border border-slate-200 px-2 py-1" />
                <select aria-label={`${product.name} category`} value={product.category} onChange={(event) => updateListRecord('products', product.id, 'category', Number(event.target.value))} className="rounded border border-slate-200 px-2 py-1">{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
                <div className="flex gap-2"><button type="button" onClick={() => saveProduct(product)} className="rounded-md bg-slate-950 px-3 py-2 text-xs font-medium text-white">Save</button><button type="button" onClick={() => deleteProduct(product)} className="rounded-md border border-rose-300 px-3 py-2 text-xs text-rose-700">Delete</button></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product.is_active} onChange={(event) => updateListRecord('products', product.id, 'is_active', event.target.checked)} />Active</label>
                </div>
                <details className="mt-3 border-t border-slate-100 pt-3">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700">Manage images ({product.images?.length || 0})</summary>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {(product.images || []).map((image) => <div key={image.id} className="flex gap-3 border border-slate-200 p-3">
                      <img src={buildImageUrl(image.image)} alt={image.alt_text || product.name} className="h-16 w-16 rounded object-cover" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <input aria-label={`Alt text for ${product.name}`} defaultValue={image.alt_text} onBlur={(event) => event.target.value !== image.alt_text && updateProductImage(image, { alt_text: event.target.value })} className="w-full rounded border border-slate-200 px-2 py-1 text-sm" />
                        <div className="flex items-center justify-between gap-2">
                          <label className="flex items-center gap-2 text-xs"><input type="radio" name={`primary-image-${product.id}`} checked={image.is_primary} onChange={() => updateProductImage(image, { is_primary: true })} />Primary</label>
                          <button type="button" onClick={() => deleteProductImage(image)} className="text-xs text-rose-700">Remove</button>
                        </div>
                      </div>
                    </div>)}
                    <label className="flex min-h-20 cursor-pointer items-center justify-center border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-600 hover:bg-slate-50">
                      Upload another image
                      <input type="file" accept="image/*" className="sr-only" onChange={(event) => { uploadProductImage(product, event.target.files?.[0]); event.target.value = '' }} />
                    </label>
                  </div>
                </details>
              </article>)}
            </section>
          </div>
        )}

        {activeSection === 'categories' && (
          <div className="space-y-6">
            <form onSubmit={createCategory} className="grid gap-3 border-b border-slate-200 pb-6 sm:grid-cols-3">
              <h2 className="text-lg font-semibold sm:col-span-3">Add category</h2>
              <input aria-label="Category name" placeholder="Name" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
              <input aria-label="Category slug" placeholder="Slug" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} required className="rounded-md border border-slate-300 px-3 py-2.5" />
              <button className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">Create category</button>
              <textarea aria-label="Category description" placeholder="Description" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} className="min-h-20 rounded-md border border-slate-300 px-3 py-2.5 sm:col-span-3" />
            </form>
            <div className="divide-y divide-slate-200 border-y border-slate-200">{data.categories.map((category) => <article key={category.id} className="grid gap-3 py-4 md:grid-cols-[1fr_1fr_2fr_auto_auto] md:items-center"><input aria-label={`${category.name} name`} value={category.name} onChange={(event) => updateListRecord('categories', category.id, 'name', event.target.value)} className="rounded border border-slate-200 px-2 py-2" /><input aria-label={`${category.name} slug`} value={category.slug} onChange={(event) => updateListRecord('categories', category.id, 'slug', event.target.value)} className="rounded border border-slate-200 px-2 py-2" /><input aria-label={`${category.name} description`} value={category.description || ''} onChange={(event) => updateListRecord('categories', category.id, 'description', event.target.value)} className="rounded border border-slate-200 px-2 py-2" /><button type="button" onClick={() => saveCategory(category)} className="rounded-md bg-slate-950 px-3 py-2 text-sm text-white">Save</button><button type="button" onClick={() => deleteCategory(category)} className="rounded-md border border-rose-300 px-3 py-2 text-sm text-rose-700">Delete</button></article>)}</div>
          </div>
        )}

        {activeSection === 'orders' && (
          <section className="divide-y divide-slate-200 border-y border-slate-200">
            {data.orders.map((order) => <article key={order.id} className="grid gap-4 py-5 lg:grid-cols-[1fr_1fr_1fr_180px] lg:items-start">
              <div><h2 className="font-semibold">Order #{order.id}</h2><p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleString()}</p></div>
              <div><p className="font-medium">{order.customer_username || `Customer #${order.customer}`}</p><p className="text-sm text-slate-500">{order.customer_email}</p></div>
              <div><p className="font-semibold">{formatCurrency(order.total_amount)}</p><ul className="mt-1 text-sm text-slate-600">{(order.items || []).map((item) => <li key={item.id}>{item.product_name} · {item.quantity} × {formatCurrency(item.price)}</li>)}</ul></div>
              <div><p className="mb-2 text-sm capitalize text-slate-600">{order.status}</p><select aria-label={`Status for order ${order.id}`} value="" disabled={!statusChoices[order.status]?.length} onChange={(event) => updateOrderStatus(order, event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"><option value="">Update status</option>{(statusChoices[order.status] || []).map((status) => <option key={status} value={status}>{status}</option>)}</select></div>
            </article>)}
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminManagementPage