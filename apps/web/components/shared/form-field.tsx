import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

export function FormField({ id, label, required, error, children, className, inputClassName }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium flex items-center gap-0.5">
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      {children ?? <Input id={id} className={cn(error && 'border-destructive', inputClassName)} />}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
