'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', className)}
      {...props}
    />
  );
}

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <div className={cn('mb-4 flex flex-col space-y-2', className)} {...props} />;
}

type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
  );
}

type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('', className)} {...props} />;
}

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('flex items-center pt-4', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
