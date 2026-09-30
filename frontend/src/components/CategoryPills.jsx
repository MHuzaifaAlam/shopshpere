const CategoryPills = ({ categories, selectedCategory, onSelect }) => (
  <div className="flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => onSelect('all')}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedCategory === 'all' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
    >
      All
    </button>

    {categories.map((category) => (
      <button
        key={category.id ?? category.slug}
        type="button"
        onClick={() => onSelect(category.id ?? category.slug)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${String(selectedCategory) === String(category.id ?? category.slug) ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
      >
        {category.name}
      </button>
    ))}
  </div>
)

export default CategoryPills
