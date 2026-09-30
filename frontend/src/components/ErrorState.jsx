const ErrorState = ({ message, actionLabel, onAction }) => (
  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-slate-700">
    <p className="text-lg font-semibold text-rose-700">Something went wrong</p>
    <p className="mt-2 text-sm text-slate-600">{message}</p>

    {onAction && actionLabel && (
      <button
        type="button"
        onClick={onAction}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        {actionLabel}
      </button>
    )}
  </div>
)

export default ErrorState
