"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [errorSrc, setErrorSrc] = useState<string | null>(null);

  const showImage = Boolean(src) && errorSrc !== src;
  const imageLoaded = Boolean(src) && loadedSrc === src;
  const showSkeleton = showImage && !imageLoaded;

  return (
    <Avatar size={size} className={cn(className)}>
      {showImage ? (
        <AvatarImage
          src={src}
          alt={name}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setErrorSrc(src)}
          className={cn(!imageLoaded && "opacity-0")}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "icon-surface text-foreground font-medium",
          showSkeleton && "opacity-0",
        )}
      >
        {getInitials(name)}
      </AvatarFallback>
      {showSkeleton ? (
        <Skeleton
          className="absolute inset-0 z-10 size-full rounded-full"
          aria-hidden
        />
      ) : null}
    </Avatar>
  );
}
