import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { customAvatarUrl } from "@/lib/avatar";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

export function UserAvatar({
  name,
  avatarUrl,
  size = "default",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const src = customAvatarUrl(avatarUrl);

  return (
    <Avatar size={size} className={cn(className)}>
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="bg-white font-medium text-neutral-950 dark:bg-neutral-950 dark:text-white">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
