import { createFileRoute } from "@tanstack/react-router";
import { AccountPage } from "./account";

export const Route = createFileRoute("/account/api-keys")({
  head: () => ({
    meta: [
      { title: "Developer API Keys & Management | bg.tools" },
      { name: "description", content: "Manage your bg.tools REST API keys, view quotas, usage logs, and test endpoints." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AccountPage,
});
