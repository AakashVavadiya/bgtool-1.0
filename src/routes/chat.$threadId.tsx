import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});
