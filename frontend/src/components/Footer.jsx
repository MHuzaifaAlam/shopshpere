import { Link } from 'react-router-dom'

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <Link to="/" className="text-xl font-semibold tracking-[0.18em] text-slate-900 uppercase">
            ShopSphere
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Premium essentials for everyday living, built for people who want less friction and more value.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li><Link to="/products" className="transition hover:text-slate-900">Shop</Link></li>
            <li><Link to="/orders" className="transition hover:text-slate-900">Orders</Link></li>
            <li><Link to="/cart" className="transition hover:text-slate-900">Cart</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            <li>Shipping & returns</li>
            <li>Customer care</li>
            <li>Privacy policy</li>
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
        © 2026 ShopSphere. Crafted for modern living.
      </div>
    </div>
  </footer>
)

export default Footer
