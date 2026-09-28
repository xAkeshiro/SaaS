import { cn } from "@/lib/utils";

export function Container({ className, children, ...rest }: React.ComponentProps<"div">) {
  return (
    <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)} {...rest}>
      {children}
    </div>
  );
}
