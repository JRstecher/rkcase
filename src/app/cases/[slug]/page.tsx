import { CaseOpenClient } from "./CaseOpenClient";

export default async function CaseOpenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CaseOpenClient slug={slug} />;
}

