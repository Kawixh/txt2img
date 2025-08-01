import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-bounce disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 relative overflow-hidden group active:scale-95",
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-lg hover:shadow-purple-500/25 transform hover:-translate-y-0.5',
        destructive:
          'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/25 transform hover:-translate-y-0.5',
        outline:
          'border-2 border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/50 hover:text-accent-foreground hover:border-purple-500/50 hover:shadow-md transform hover:-translate-y-0.5',
        secondary:
          'bg-secondary/80 text-secondary-foreground hover:bg-secondary hover:shadow-md transform hover:-translate-y-0.5',
        ghost:
          'hover:bg-accent/50 hover:text-accent-foreground rounded-xl hover:shadow-sm transform hover:-translate-y-0.5',
        link: 'text-purple-600 underline-offset-4 hover:underline hover:text-purple-700',
        gradient:
          'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 hover:shadow-lg hover:shadow-blue-500/25 transform hover:-translate-y-0.5',
        glass:
          'glass-panel text-foreground hover:bg-white/10 dark:hover:bg-black/10 transform hover:-translate-y-0.5 hover:shadow-lg',
      },
      size: {
        default: 'h-10 px-6 py-2 has-[>svg]:px-4',
        sm: 'h-8 rounded-lg gap-1.5 px-4 has-[>svg]:px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 has-[>svg]:px-6 text-base font-semibold',
        icon: 'size-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
