import * as React from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CalendarIcon, CheckCircle, Eye, EyeOff, Info } from "lucide-react";
import { format } from "date-fns";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface FormFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  helperText?: string;
  tooltip?: string;
}

export interface TextFieldProps extends FormFieldProps {
  type?: "text" | "email" | "password" | "tel" | "url" | "number";
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  showPasswordToggle?: boolean;
}

export interface TextareaFieldProps extends FormFieldProps {
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export interface SelectFieldProps extends FormFieldProps {
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  placeholder?: string;
  multiple?: boolean;
}

export interface CheckboxFieldProps extends FormFieldProps {
  description?: string;
}

export interface SwitchFieldProps extends FormFieldProps {
  description?: string;
}

export interface RadioFieldProps extends FormFieldProps {
  options: Array<{ label: string; value: string; description?: string }>;
}

export interface SliderFieldProps extends FormFieldProps {
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  valueFormat?: (value: number) => string;
}

export interface DateFieldProps extends FormFieldProps {
  dateFormat?: string;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
}

const FormFieldWrapper: React.FC<{
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  className?: string;
}> = ({ children, error, helperText, className }) => (
  <div className={cn("space-y-2", className)}>
    {children}
    {(error || helperText) && (
      <div className="flex items-start gap-2 text-sm">
        {error ? (
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
        ) : helperText ? (
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        ) : null}
        <p className={cn(
          "leading-relaxed",
          error ? "text-destructive" : "text-muted-foreground"
        )}>
          {error || helperText}
        </p>
      </div>
    )}
  </div>
);

const FieldLabel: React.FC<{
  label?: string;
  required?: boolean;
  tooltip?: string;
  className?: string;
}> = ({ label, required, tooltip, className }) => {
  if (!label) return null;

  const labelContent = (
    <Label className={cn(
      "text-sm font-semibold text-foreground flex items-center gap-2",
      className
    )}>
      {label}
      {required && <span className="text-destructive">*</span>}
    </Label>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            {labelContent}
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return labelContent;
};

// Text Field Component
export const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  description,
  placeholder,
  type = "text",
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  helperText,
  tooltip,
  min,
  max,
  step,
  pattern,
  showPasswordToggle,
}) => {
  const { register, formState: { errors }, watch } = useFormContext();
  const [showPassword, setShowPassword] = React.useState(false);
  const error = errors[name]?.message as string;
  const value = watch(name);

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <FormFieldWrapper error={error} helperText={helperText} className={className}>
      <FieldLabel label={label} required={required} tooltip={tooltip} className={labelClassName} />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <Input
          {...register(name, {
            required: required ? `${label} is required` : false,
            min: min ? { value: min, message: `Minimum value is ${min}` } : undefined,
            max: max ? { value: max, message: `Maximum value is ${max}` } : undefined,
            pattern: pattern ? { value: new RegExp(pattern), message: "Invalid format" } : undefined,
          })}
          type={inputType}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={cn(
            "h-12 rounded-xl border-border/40 bg-background/50 backdrop-blur-sm",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
            "transition-all duration-200",
            error && "border-destructive/50 focus:border-destructive",
            inputClassName
          )}
        />
        {type === "password" && showPasswordToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        )}
        {type === "number" && value !== undefined && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
            {value}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
};

// Textarea Field Component
export const TextareaField: React.FC<TextareaFieldProps> = ({
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  helperText,
  tooltip,
  rows = 3,
  maxLength,
  showCount,
}) => {
  const { register, formState: { errors }, watch } = useFormContext();
  const error = errors[name]?.message as string;
  const value = watch(name);

  return (
    <FormFieldWrapper error={error} helperText={helperText} className={className}>
      <FieldLabel label={label} required={required} tooltip={tooltip} className={labelClassName} />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="relative">
        <Textarea
          {...register(name, {
            required: required ? `${label} is required` : false,
            maxLength: maxLength ? {
              value: maxLength,
              message: `Maximum ${maxLength} characters allowed`
            } : undefined,
          })}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            "rounded-xl border-border/40 bg-background/50 backdrop-blur-sm",
            "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
            "transition-all duration-200 resize-none",
            error && "border-destructive/50 focus:border-destructive",
            inputClassName
          )}
        />
        {showCount && maxLength && (
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground font-mono">
            {(value || "").length}/{maxLength}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  );
};

// Select Field Component
export const SelectField: React.FC<SelectFieldProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  helperText,
  tooltip,
  options,
  placeholder,
}) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;
  const value = watch(name);

  return (
    <FormFieldWrapper error={error} helperText={helperText} className={className}>
      <FieldLabel label={label} required={required} tooltip={tooltip} className={labelClassName} />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Select
        value={value}
        onValueChange={(newValue) => setValue(name, newValue)}
        disabled={disabled}
      >
        <SelectTrigger className={cn(
          "h-12 rounded-xl border-border/40 bg-background/50 backdrop-blur-sm",
          "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
          "transition-all duration-200",
          error && "border-destructive/50 focus:border-destructive",
          inputClassName
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border/40 bg-background/95 backdrop-blur-sm">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="rounded-lg"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
};

// Checkbox Field Component
export const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  className,
  helperText,
  tooltip,
}) => {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;

  return (
    <FormFieldWrapper error={error} helperText={helperText} className={className}>
      <div className="flex items-start space-x-3">
        <Checkbox
          {...register(name, {
            required: required ? `${label} is required` : false,
          })}
          disabled={disabled}
          className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
        <div className="space-y-1">
          {label && (
            <FieldLabel label={label} required={required} tooltip={tooltip} className="text-sm font-medium" />
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </FormFieldWrapper>
  );
};

// Date Field Component
export const DateField: React.FC<DateFieldProps> = ({
  name,
  label,
  description,
  required,
  disabled,
  className,
  labelClassName,
  inputClassName,
  helperText,
  tooltip,
  dateFormat = "PPP",
  disabledDates,
  minDate,
  maxDate,
}) => {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string;
  const value = watch(name);
  const [open, setOpen] = React.useState(false);

  const date = value ? new Date(value) : undefined;

  return (
    <FormFieldWrapper error={error} helperText={helperText} className={className}>
      <FieldLabel label={label} required={required} tooltip={tooltip} className={labelClassName} />
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-12 w-full justify-start text-left font-normal rounded-xl border-border/40 bg-background/50 backdrop-blur-sm",
              "focus:border-primary/50 focus:ring-2 focus:ring-primary/10",
              "transition-all duration-200",
              !date && "text-muted-foreground",
              error && "border-destructive/50 focus:border-destructive",
              inputClassName
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, dateFormat) : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xl border-border/40 bg-background/95 backdrop-blur-sm" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              setValue(name, newDate?.toISOString());
              setOpen(false);
            }}
            disabled={disabledDates}
            fromDate={minDate}
            toDate={maxDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </FormFieldWrapper>
  );
};

// Export all form field components
export const FormFields = {
  Text: TextField,
  Textarea: TextareaField,
  Select: SelectField,
  Checkbox: CheckboxField,
  Date: DateField,
};