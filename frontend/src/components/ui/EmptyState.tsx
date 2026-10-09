import { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-[#01a0e2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#eaf5e5] hover:text-[#365f22] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
