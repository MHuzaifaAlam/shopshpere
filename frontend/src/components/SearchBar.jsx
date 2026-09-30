const SearchBar = ({ value, onChange, placeholder = 'Search products...', className = '' }) => (
  <label className={`flex w-full items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm transition focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200 ${className}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 text-slate-500">
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16L21 21" strokeLinecap="round"/>
    </svg>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
      aria-label="Search products"
    />
  </label>
)

export default SearchBar
