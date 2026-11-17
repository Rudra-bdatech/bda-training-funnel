import { createFileRoute, redirect } from "@tanstack/react-router";

// The funnel has no home page: send visitors to the training, keeping UTM / click-ID params.
export const Route = createFileRoute("/")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: `/free-training${location.searchStr ?? ""}`, statusCode: 302 });
  },
});
