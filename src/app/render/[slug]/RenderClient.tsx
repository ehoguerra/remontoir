"use client";

import dynamic from "next/dynamic";
import type { RenderView } from "@/components/three/RenderStage";

const RenderStage = dynamic(() => import("@/components/three/RenderStage"), { ssr: false });

export default function RenderClient({ slug, view }: { slug: string; view: RenderView }) {
  return (
    <>
      <style>{`html{scrollbar-gutter:auto;overflow:hidden;background:transparent}body{margin:0}`}</style>
      <RenderStage slug={slug} view={view} />
    </>
  );
}
