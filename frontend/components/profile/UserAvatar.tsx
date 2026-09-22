"use client";

import { useState } from "react";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Provider photo (Google/GitHub) when the account has one, otherwise the
 * user's initials. Falls back to initials if the photo fails to load.
 */
export function UserAvatar({
  name,
  image,
  className,
}: {
  name: string | null;
  image: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const showImage = image !== null && failed !== image;

  return (
    <span className={cn("grid place-items-center overflow-hidden", className)}>
      {showImage ? (
        // Provider avatars live on arbitrary hosts, so next/image would need a
        // remotePatterns entry per provider.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setFailed(image)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden>{name ? initials(name) : "?"}</span>
      )}
    </span>
  );
}

export default UserAvatar;
