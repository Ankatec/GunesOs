import { createFileRoute } from "@tanstack/react-router";
import GunesOS from "@/components/GunesOS";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <GunesOS />;
}
