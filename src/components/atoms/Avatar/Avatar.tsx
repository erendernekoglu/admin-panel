import { cn } from "../../../lib/utils"

interface AvatarProps {
  name: string
  image?: string
  className?: string
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr")
}

export function Avatar({ name, image, className }: AvatarProps) {
  if (image) {
    return <img alt={`${name} avatar`} className={cn("size-9 rounded-full border border-line object-cover", className)} src={image} />
  }
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-accent-soft text-[13px] font-bold text-accent-ink",
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
