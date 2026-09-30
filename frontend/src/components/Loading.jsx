const Loading = ({ message = 'Loading...' }) => (
  <div className="flex min-h-[220px] items-center justify-center">
    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
      {message}
    </div>
  </div>
)

export default Loading
