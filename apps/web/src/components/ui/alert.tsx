'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const alertVariants = cva('rounded-lg border-l-4 p-4 text-sm', {
  variants: {
    variant: {
      default: 'border-l-primary bg-primary/5 text-primary',
      info: 'border-l-accent bg-accent/5 text-accent',
      success: 'border-l-success bg-success/5 text-success',
      warning: 'border-l-warning bg-warning/5 text-warning',
      error: 'border-l-destructive bg-destructive/5 text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type AlertProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return <div className={cn(alertVariants({ variant }), className)} {...props} />;
}

type AlertTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

function AlertTitle({ className, ...props }: AlertTitleProps) {
  return <h5 className={cn('mb-1 font-semibold', className)} {...props} />;
}

type AlertDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

function AlertDescription({ className, ...props }: AlertDescriptionProps) {
  return <div className={cn('text-sm', className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription, alertVariants };
