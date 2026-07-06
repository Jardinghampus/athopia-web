import fs from "fs";
import path from "path";
import { FEATURE_DOCS } from "./architecture-map";

const DOCS_ROOT = path.join(process.cwd(), "docs", "product");

export function listFeatureDocs() {
  return Object.values(FEATURE_DOCS);
}

export function listAllDocs(): { slug: string; title: string; kind: "feature" | "guide" }[] {
  const guides = [
    { slug: "README", title: "Översikt", kind: "guide" as const },
    { slug: "ARCHITECTURE_BLUEPRINT", title: "Arkitekturritning", kind: "guide" as const },
    { slug: "AI_FIX_GUIDE", title: "AI felsökningsguide", kind: "guide" as const },
  ];
  const features = listFeatureDocs().map((d) => ({
    slug: d.slug,
    title: d.title,
    kind: "feature" as const,
  }));
  return [...guides, ...features];
}

export function readDoc(slug: string): string | null {
  const featurePath = path.join(DOCS_ROOT, "features", `${slug}.md`);
  if (fs.existsSync(featurePath)) return fs.readFileSync(featurePath, "utf8");

  const guidePath = path.join(DOCS_ROOT, `${slug}.md`);
  if (fs.existsSync(guidePath)) return fs.readFileSync(guidePath, "utf8");

  return null;
}
