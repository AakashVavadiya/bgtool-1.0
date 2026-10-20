export interface ProfileAvatar {
  id: string;
  gender: "boy" | "girl";
  label: string;
  src: string;
  filename: string;
}

export const BOY_AVATARS: ProfileAvatar[] = [
  { id: "boy-1", gender: "boy", label: "Boy 1", src: "/profile-avatars/Boy1.jpg", filename: "Boy1.jpg" },
  { id: "boy-2", gender: "boy", label: "Boy 2", src: "/profile-avatars/Boy2.jpg", filename: "Boy2.jpg" },
  { id: "boy-3", gender: "boy", label: "Boy 3", src: "/profile-avatars/Boy3.jpg", filename: "Boy3.jpg" },
  { id: "boy-4", gender: "boy", label: "Boy 4", src: "/profile-avatars/Boy4.jpg", filename: "Boy4.jpg" },
  { id: "boy-5", gender: "boy", label: "Boy 5", src: "/profile-avatars/Boy5.jpg", filename: "Boy5.jpg" },
  { id: "boy-6", gender: "boy", label: "Boy 6", src: "/profile-avatars/Boy6.jpg", filename: "Boy6.jpg" },
  { id: "boy-7", gender: "boy", label: "Boy 7", src: "/profile-avatars/Boy7.jpg", filename: "Boy7.jpg" },
  { id: "boy-8", gender: "boy", label: "Boy 8", src: "/profile-avatars/Boy8.jpg", filename: "Boy8.jpg" },
  { id: "boy-9", gender: "boy", label: "Boy 9", src: "/profile-avatars/Boy9.jpg", filename: "Boy9.jpg" },
  { id: "boy-10", gender: "boy", label: "Boy 10", src: "/profile-avatars/Boy10.jpg", filename: "Boy10.jpg" },
];

export const GIRL_AVATARS: ProfileAvatar[] = [
  { id: "girl-1", gender: "girl", label: "Girl 1", src: "/profile-avatars/Girl1.jpg", filename: "Girl1.jpg" },
  { id: "girl-2", gender: "girl", label: "Girl 2", src: "/profile-avatars/Girl2.jpg", filename: "Girl2.jpg" },
  { id: "girl-3", gender: "girl", label: "Girl 3", src: "/profile-avatars/Girl3.jpg", filename: "Girl3.jpg" },
  { id: "girl-4", gender: "girl", label: "Girl 4", src: "/profile-avatars/Girl4.jpg", filename: "Girl4.jpg" },
  { id: "girl-5", gender: "girl", label: "Girl 5", src: "/profile-avatars/Girl5.jpg", filename: "Girl5.jpg" },
  { id: "girl-6", gender: "girl", label: "Girl 6", src: "/profile-avatars/Girl6.jpg", filename: "Girl6.jpg" },
  { id: "girl-7", gender: "girl", label: "Girl 7", src: "/profile-avatars/Girl7.jpg", filename: "Girl7.jpg" },
  { id: "girl-8", gender: "girl", label: "Girl 8", src: "/profile-avatars/Girl8.jpg", filename: "Girl8.jpg" },
  { id: "girl-9", gender: "girl", label: "Girl 9", src: "/profile-avatars/Girl9.jpg", filename: "Girl9.jpg" },
  { id: "girl-10", gender: "girl", label: "Girl 10", src: "/profile-avatars/Girl10.jpg", filename: "Girl10.jpg" },
];

export const ALL_PROFILE_AVATARS: ProfileAvatar[] = [...BOY_AVATARS, ...GIRL_AVATARS];

const AVATAR_MAP = new Map<string, ProfileAvatar>();
ALL_PROFILE_AVATARS.forEach((av) => {
  AVATAR_MAP.set(av.id, av);
  AVATAR_MAP.set(av.src, av);
  AVATAR_MAP.set(av.filename.toLowerCase(), av);
});

/**
 * Returns a valid URL for a given avatar string (id, path, or custom URL),
 * or null if none is set.
 */
export function getAvatarUrl(avatar?: string | null): string | null {
  if (!avatar || typeof avatar !== "string") return null;
  const clean = avatar.trim();
  if (!clean) return null;

  // Direct match in registry by id or filename
  const found = AVATAR_MAP.get(clean) || AVATAR_MAP.get(clean.toLowerCase());
  if (found) return found.src;

  // Already a full path or URL
  if (clean.startsWith("/") || clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }

  // If provided as "Boy1.jpg" or "Girl3.jpg"
  if (/^(Boy|Girl)\d+\.(jpg|jpeg|png)$/i.test(clean)) {
    return `/profile-avatars/${clean}`;
  }

  return `/profile-avatars/${clean}`;
}
