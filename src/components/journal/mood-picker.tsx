import { MOODS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { MoodType } from '@/types'

interface MoodPickerProps {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        How are you feeling?
      </label>
      <div className="flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <Button
            key={mood.id}
            type="button"
            variant={value === mood.id ? 'default' : 'outline'}
            className={`rounded-full h-10 px-4 ${
              value === mood.id ? 'bg-primary text-white shadow-md' : 'bg-background hover:bg-secondary'
            }`}
            onClick={() => onChange(mood.id as MoodType)}
          >
            <span className="mr-2 text-lg">{mood.emoji}</span>
            {mood.label}
          </Button>
        ))}
      </div>
    </div>
  )
}
