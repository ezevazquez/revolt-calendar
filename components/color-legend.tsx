"use client"

interface ColorLegendProps {
  className?: string
}

export function ColorLegend({ className = "" }: ColorLegendProps) {
  const statusTypes = [
    {
      status: "approved",
      label: "Approved Holiday",
      description: "Official holiday – no work",
      color: "#DC2626", // red-600
      style: "solid"
    },
    {
      status: "working", 
      label: "Working Day",
      description: "Holiday, but we work",
      color: "#EA580C", // orange-600
      style: "blurred"
    },
    {
      status: "custom",
      label: "Custom day off",
      description: "Revolt's day off",
      color: "#9333EA", // purple-600
      style: "solid"
    }
  ]

  return (
    <div className={`bg-slate-800/30 rounded-lg border border-slate-700/50 p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-3 text-slate-200">Holiday Status</h3>
      <div className="space-y-3">
        {statusTypes.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <div 
              className={`w-4 h-4 rounded flex-shrink-0 ${
                item.style === 'blurred' ? 'bg-orange-500/60 backdrop-blur-sm' : ''
              }`}
              style={item.style === 'solid' ? { backgroundColor: item.color } : {}}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200">{item.label}</p>
              <p className="text-xs text-slate-400">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
