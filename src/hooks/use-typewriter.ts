import { useEffect, useState } from "react";

export interface UseTypewriterOptions {
  typingSpeed?: number;
  deletingSpeed?: number;
  holdDuration?: number;
  pauseBeforeRetype?: number;
  isPaused?: boolean;
}

/**
 * Reusable hook to create realistic typewriter text animation.
 * Loops smoothly through a list of words or phrases with typing, pausing, and erasing phases.
 */
export function useTypewriter(
  words: string[],
  {
    typingSpeed = 65,
    deletingSpeed = 30,
    holdDuration = 2000,
    pauseBeforeRetype = 400,
    isPaused = false,
  }: UseTypewriterOptions = {}
): string {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!words.length || isPaused) return;

    const currentWord = words[wordIndex % words.length] ?? "";
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      // Forward typing phase
      if (text.length < currentWord.length) {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1));
        }, typingSpeed);
      } else {
        // Complete phrase displayed: hold so user can read
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, holdDuration);
      }
    } else {
      // Deleting / erasing phase
      if (text.length > 0) {
        timer = setTimeout(() => {
          setText(currentWord.slice(0, text.length - 1));
        }, deletingSpeed);
      } else {
        // Completely erased: brief natural pause before next word
        timer = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }, pauseBeforeRetype);
      }
    }

    return () => clearTimeout(timer);
  }, [
    text,
    isDeleting,
    wordIndex,
    words,
    typingSpeed,
    deletingSpeed,
    holdDuration,
    pauseBeforeRetype,
    isPaused,
  ]);

  return text;
}

/**
 * Hook for search input placeholders with typewriter animation and blinking cursor.
 */
export function useTypewriterPlaceholder(
  words: string[],
  isFocused: boolean = false,
  options?: Omit<UseTypewriterOptions, "isPaused">
): string {
  const animatedText = useTypewriter(words, {
    typingSpeed: options?.typingSpeed ?? 60,
    deletingSpeed: options?.deletingSpeed ?? 28,
    holdDuration: options?.holdDuration ?? 2100,
    pauseBeforeRetype: options?.pauseBeforeRetype ?? 380,
    isPaused: isFocused,
  });

  const [cursorVisible, setCursorVisible] = useState(true);

  // Blinking cursor ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  // When focused, the browser's native caret is blinking, so hide the fake pipe cursor
  return isFocused ? animatedText : `${animatedText}${cursorVisible ? "|" : ""}`;
}
