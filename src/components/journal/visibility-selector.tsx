import { VISIBILITY_OPTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { VisibilityType } from '@/types'
import { Globe, Lock, Users } from 'lucide-react'

interface VisibilitySelectorProps {
  value: VisibilityType;
  onChange: (visibility: VisibilityType) => void;
}

export function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  const getIcon = (type: VisibilityType) => {
    switch (type) {
      case 'private': return <Lock className="w-4 h-4 mr-2" />
      case 'friends': return <Users className="w-4 h-4 mr-2" />
      case 'public': return <Globe className="w-4 h-4 mr-2" />
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none">
        Visibility
      </label>
      <div className="flex flex-wrap gap-3">
        {VISIBILITY_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id as VisibilityType)}
            className={`flex-1 min-w-[120px] p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              value === option.id 
                ? 'border-primary bg-primary/5 shadow-sm' 
                : 'border-border bg-card hover:border-primary/30 hover:bg-secondary/50'
            }`}
          >
            <div className="flex items-center font-medium mb-1">
              <span className={value === option.id ? 'text-primary' : 'text-muted-foreground'}>
                {getIcon(option.id as VisibilityType)}
              </span>
              <span className={value === option.id ? 'text-foreground' : 'text-muted-foreground'}>
                {option.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
