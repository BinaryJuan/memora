import { OFFSET_OPTIONS } from '@/lib/kinds';
import { Chip, ChipRow } from './ui';

export function OffsetPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <ChipRow>
      {OFFSET_OPTIONS.map((o) => {
        const on = value.includes(o.days);
        return (
          <Chip
            key={o.days}
            label={o.label}
            selected={on}
            onPress={() => onChange(on ? value.filter((d) => d !== o.days) : [...value, o.days].sort((a, b) => a - b))}
          />
        );
      })}
    </ChipRow>
  );
}
