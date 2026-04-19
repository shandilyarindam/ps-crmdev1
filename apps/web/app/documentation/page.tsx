import type { Metadata } from "next";
import DocumentationClient from "./DocumentationClient";

export const metadata: Metadata = {
  title: "JanSamadhan Documentation | Citizen Resolution Platform",
  description:
    "Comprehensive technical documentation for JanSamadhan, including architecture, lifecycle guarantees, API surface, operations, and roadmap.",
  alternates: {
    canonical: "https://jansamadhan.perkkk.dev/documentation",
  },
  openGraph: {
    title: "JanSamadhan Documentation",
    description:
      "Detailed JanSamadhan platform documentation for judges, engineers, and civic stakeholders.",
    url: "https://jansamadhan.perkkk.dev/documentation",
    siteName: "JanSamadhan",
    locale: "en_IN",
    type: "website",
  },
};

export default function DocumentationPage() {
  return <DocumentationClient />;
}

