import { useState } from "react";
import { X, Check, Sparkles, Trash2 } from "lucide-react";
import {
  BOY_AVATARS,
  GIRL_AVATARS,
  ALL_PROFILE_AVATARS,
  getAvatarUrl,
  type ProfileAvatar,
} from "@/lib/profile-avatars";
import { AuthUser, type CurrentUser } from "@/lib/auth-user";
import { toast } from "sonner";

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser;
  onAvatarUpdated?: (newAvatar: string | null) => void;
}

export function AvatarPickerModal({
  isOpen,
  onClose,
  currentUser,
  onAvatarUpdated,
}: AvatarPickerModalProps) {
  const [selectedGender, setSelectedGender] = useState<"all" | "boy" | "girl">("all");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(
    currentUser.avatar || null
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const currentAvatarUrl = getAvatarUrl(selectedAvatarId);
  const initialAvatarUrl = getAvatarUrl(currentUser.avatar);

  const displayedAvatars =
    selectedGender === "boy"
      ? BOY_AVATARS
      : selectedGender === "girl"
      ? GIRL_AVATARS
      : ALL_PROFILE_AVATARS;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await AuthUser.updateAvatar(selectedAvatarId);
      if (res.success) {
        toast.success("Profile avatar updated successfully!");
        onAvatarUpdated?.(selectedAvatarId);
        onClose();
      } else {
        toast.error(res.error || "Failed to update avatar.");
      }
    } catch {
      toast.error("An error occurred while updating your avatar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelect = (avatar: ProfileAvatar) => {
    setSelectedAvatarId(avatar.filename);
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatarId(null);
  };

  const hasChanged = (selectedAvatarId || "") !== (currentUser.avatar || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
                Choose Profile Avatar
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Select from our curated Boy & Girl character avatars
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Active Avatar Preview Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {currentAvatarUrl ? (
                  <img
                    src={currentAvatarUrl}
                    alt={currentUser.name}
                    className="h-16 w-16 rounded-2xl object-cover ring-4 ring-orange-500/20 shadow-md"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white font-display text-2xl font-black shadow-md ring-4 ring-orange-500/10">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-black text-slate-950 dark:text-white text-base">
                    {currentUser.name}
                  </h4>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 text-[10px] font-extrabold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                    {currentUser.plan}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {currentAvatarUrl ? "Custom avatar selected" : "Default letter avatar"}
                </p>
              </div>
            </div>

            {selectedAvatarId && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Use Initials</span>
              </button>
            )}
          </div>

          {/* Gender Filter Pills */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSelectedGender("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedGender === "all"
                    ? "bg-white dark:bg-zinc-900 text-slate-950 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                All (20)
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender("boy")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedGender === "boy"
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <span>👦 Boys</span>
                <span className="text-[10px] opacity-75">10</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGender("girl")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedGender === "girl"
                    ? "bg-white dark:bg-zinc-900 text-pink-600 dark:text-pink-400 shadow-xs"
                    : "text-slate-600 dark:text-zinc-400 hover:text-slate-900"
                }`}
              >
                <span>👧 Girls</span>
                <span className="text-[10px] opacity-75">10</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 hidden sm:inline">
              Click an image to preview
            </span>
          </div>

          {/* Avatar Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
            {displayedAvatars.map((av) => {
              const isSelected =
                selectedAvatarId === av.filename ||
                selectedAvatarId === av.id ||
                selectedAvatarId === av.src;

              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => handleSelect(av)}
                  className={`group relative flex flex-col items-center rounded-2xl p-2.5 transition-all text-center cursor-pointer border ${
                    isSelected
                      ? "border-orange-500 bg-orange-500/10 dark:bg-orange-950/30 ring-2 ring-orange-500 shadow-sm"
                      : "border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 hover:border-orange-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800/70"
                  }`}
                >
                  {/* Image Avatar */}
                  <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-2 bg-slate-200 dark:bg-zinc-800">
                    <img
                      src={av.src}
                      alt={av.label}
                      loading="lazy"
                      className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                        isSelected ? "scale-105" : ""
                      }`}
                    />

                    {/* Selected Checkmark Badge */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-md animate-in zoom-in-75 duration-150">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Gender Indicator Pill */}
                    <span
                      className={`absolute bottom-1 left-1 rounded-md px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs ${
                        av.gender === "boy"
                          ? "bg-blue-900/75 text-blue-100"
                          : "bg-pink-900/75 text-pink-100"
                      }`}
                    >
                      {av.gender}
                    </span>
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs font-bold transition-colors ${
                      isSelected
                        ? "text-orange-600 dark:text-orange-400 font-extrabold"
                        : "text-slate-700 dark:text-zinc-300 group-hover:text-slate-950 dark:group-hover:text-white"
                    }`}
                  >
                    {av.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanged}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-black shadow-sm transition-all cursor-pointer ${
                hasChanged
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 active:scale-95"
                  : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
              }`}
            >
              <Check className="h-4 w-4" />
              <span>{isSaving ? "Saving..." : "Save Avatar"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
