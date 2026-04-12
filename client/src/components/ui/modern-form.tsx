import * as React from "react";
import { useForm, type UseFormProps, type FieldValues, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ZodSchema, type ZodError } from "zod";
import { FormProvider } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModernFormProps<TFieldValues extends FieldValues = FieldValues> {
  schema?: ZodSchema<TFieldValues>;
  onSubmit: (data: TFieldValues, form: UseFormReturn<TFieldValues>) => void | Promise<void>;
  onError?: (errors: Record<string, any>, form: UseFormReturn<TFieldValues>) => void;
  defaultValues?: UseFormProps<TFieldValues>["defaultValues"];
  mode?: UseFormProps<TFieldValues>["mode"];
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  loading?: boolean;
  disabled?: boolean;
  showSubmitButton?: boolean;
  showCancelButton?: boolean;
  submitButtonClassName?: string;
  cancelButtonClassName?: string;
  layout?: "card" | "inline" | "modal";
  size?: "sm" | "md" | "lg";
}

export function ModernForm<TFieldValues extends FieldValues = FieldValues>({
  schema,
  onSubmit,
  onError,
  defaultValues,
  mode = "onChange",
  children,
  className,
  title,
  description,
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  onCancel,
  loading = false,
  disabled = false,
  showSubmitButton = true,
  showCancelButton = false,
  submitButtonClassName,
  cancelButtonClassName,
  layout = "card",
  size = "md",
}: ModernFormProps<TFieldValues>) {
  const form = useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode,
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isValid, isDirty },
    reset,
  } = form;

  const handleFormSubmit = async (data: TFieldValues) => {
    try {
      await onSubmit(data, form);
    } catch (error) {
      console.error("Form submission error:", error);
      // Handle submission errors if needed
    }
  };

  const handleFormError = (formErrors: Record<string, any>) => {
    console.error("Form validation errors:", formErrors);
    onError?.(formErrors, form);
  };

  const handleCancel = () => {
    reset();
    onCancel?.();
  };

  const FormContent = (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(handleFormSubmit, handleFormError)}
        className={cn("space-y-6", className)}
      >
        {/* Form Header */}
        {(title || description) && (
          <div className="space-y-2">
            {title && (
              <h3 className={cn(
                "font-semibold leading-none tracking-tight",
                size === "sm" && "text-lg",
                size === "md" && "text-xl",
                size === "lg" && "text-2xl"
              )}>
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className={cn(
          "space-y-6",
          size === "sm" && "space-y-4",
          size === "lg" && "space-y-8"
        )}>
          {children}
        </div>

        {/* Form Actions */}
        {(showSubmitButton || showCancelButton) && (
          <div className="flex items-center justify-end space-x-3 pt-4">
            {showCancelButton && (
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading || disabled}
                className={cn(
                  "rounded-xl",
                  cancelButtonClassName
                )}
              >
                {cancelLabel}
              </Button>
            )}
            {showSubmitButton && (
              <Button
                type="submit"
                disabled={loading || disabled || isSubmitting || !isValid}
                className={cn(
                  "rounded-xl min-w-[100px]",
                  submitButtonClassName
                )}
              >
                {loading || isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            )}
          </div>
        )}
      </form>
    </FormProvider>
  );

  // Different layouts
  if (layout === "inline") {
    return FormContent;
  }

  if (layout === "modal") {
    return (
      <div className="max-w-2xl mx-auto">
        {FormContent}
      </div>
    );
  }

  // Default card layout
  return (
    <Card className="rounded-2xl border-border/40 bg-background/50 backdrop-blur-sm shadow-xl">
      <CardContent className="p-8">
        {FormContent}
      </CardContent>
    </Card>
  );
}

// Form Section Component for organizing form fields
export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultOpen = true,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  if (!title) {
    return (
      <div className={cn("space-y-4", className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold leading-none">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {collapsible && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8 p-0"
          >
            {isOpen ? "−" : "+"}
          </Button>
        )}
      </div>
      {(!collapsible || isOpen) && (
        <div className="space-y-4 pl-4 border-l-2 border-border/40">
          {children}
        </div>
      )}
    </div>
  );
}

// Form Status Component
export interface FormStatusProps {
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  className?: string;
}

export function FormStatus({ type, title, message, className }: FormStatusProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const Icon = icons[type];

  return (
    <Alert className={cn(
      "rounded-xl border-border/40",
      type === "success" && "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200",
      type === "error" && "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
      type === "warning" && "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
      type === "info" && "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
      className
    )}>
      <Icon className="h-4 w-4" />
      <AlertDescription>
        {title && <div className="font-semibold">{title}</div>}
        {message}
      </AlertDescription>
    </Alert>
  );
}

// Hook for form management
export function useModernForm<TFieldValues extends FieldValues = FieldValues>(
  schema?: ZodSchema<TFieldValues>,
  options?: Partial<UseFormProps<TFieldValues>>
) {
  return useForm<TFieldValues>({
    resolver: schema ? zodResolver(schema) : undefined,
    mode: "onChange",
    ...options,
  });
}

// Utility function to get form errors as a flat object
export function getFormErrors<TFieldValues extends FieldValues>(
  errors: Record<string, any>
): Record<string, string> {
  const result: Record<string, string> = {};

  function flattenErrors(obj: any, prefix = "") {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === "object" && value.message) {
        result[newKey] = value.message;
      } else if (value && typeof value === "object") {
        flattenErrors(value, newKey);
      }
    });
  }

  flattenErrors(errors);
  return result;
}