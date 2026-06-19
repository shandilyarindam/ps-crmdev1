import { cn } from "@/src/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-theme-border/30 dark:bg-theme-border/20", className)}
      {...props}
    />
  )
}

export { Skeleton }
