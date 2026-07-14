import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ACCESS, type AccessFeature, type Plan } from "../lib/access-rules";
import { BOTTOM_NAV_ITEMS, SECONDARY_NAV_ITEMS } from "../lib/nav";
import { DEEP_LINK_ROUTES } from "../lib/deep-links";
import { API_CONTRACTS, PlanRequiredErrorSchema } from "../lib/api-schemas";
import { zodSchema } from "ai";
import type { z } from "zod";
import { APP_STORE_PRODUCTS } from "../lib/product-contract";

const VERSION = 1;
const root = process.cwd();
const generatedDir = path.join(root, "contracts", "generated");
const iosGeneratedFile = path.resolve(
  root,
  "..",
  "athopia-ios",
  "AthopiaApp",
  "AthopiaApp",
  "GeneratedProductContracts.swift",
);
const brandTokensFile = path.resolve(root, "..", "docs", "brand", "tokens.json");
const checkOnly = process.argv.includes("--check");

const plans: Plan[] = ["free", "pro", "elite"];

interface BrandTokens {
  brand: {
    green: string;
    greenOnDark: string;
    successLight: string;
    successDark: string;
    destructive: string;
  };
  light: {
    background: string;
    foreground: string;
    surface: string;
    card: string;
    mutedForeground: string;
    border: string;
  };
  dark: {
    background: string;
    foreground: string;
    surface: string;
    card: string;
    elevated: string;
    mutedForeground: string;
    border: string;
    destructive: string;
  };
  spacing: {
    grid: number;
    fineStep: number;
    touchTargetMin: number;
  };
  radius: number[];
  motion: {
    durationFastMs: number;
    durationBaseMs: number;
    bounce: boolean;
  };
}

const navigationContract = {
  schemaVersion: VERSION,
  generatedFrom: "athopia-web/lib/nav.ts",
  primary: BOTTOM_NAV_ITEMS.map(({ href, label, iosSymbol }) => ({
    id: href.slice(1).replaceAll("-", "_"),
    route: href,
    label,
    iosSymbol,
    accessFeature: href === "/ai" ? "globalAiChat" : null,
  })),
  secondary: SECONDARY_NAV_ITEMS.map(({ href, label, iosSymbol }) => ({
    id: href.slice(1).replaceAll("-", "_"),
    route: href,
    label,
    iosSymbol,
  })),
  deepLinks: DEEP_LINK_ROUTES,
};

const accessContract = {
  schemaVersion: VERSION,
  generatedFrom: "athopia-web/lib/access-rules.ts",
  plans,
  features: ACCESS,
};

const storekitContract = {
  schemaVersion: VERSION,
  generatedFrom: "athopia-web/lib/product-contract.ts",
  products: APP_STORE_PRODUCTS,
};

/** OpenAPI för de svar iOS avkodar. Genereras ur `lib/api-schemas.ts`. */
const openapiContract = {
  openapi: "3.1.0",
  info: {
    title: "Athopia client API",
    version: `${VERSION}.0.0`,
    description:
      "Genererad ur athopia-web/lib/api-schemas.ts. Redigera aldrig manuellt.",
  },
  servers: [{ url: "https://athopia.se" }],
  paths: Object.fromEntries(
    (API_CONTRACTS as readonly {
      method: string;
      path: string;
      name: string;
      schema: z.ZodTypeAny;
    }[]).map(({ method, path: route, name, schema }) => [
      route,
      {
        [method]: {
          operationId: name,
          responses: {
            "200": {
              description: "OK",
              content: {
                "application/json": {
                  schema: zodSchema(schema).jsonSchema,
                },
              },
            },
            "403": {
              description: "Otillräcklig plan — servern är auktoritativ.",
              content: {
                "application/json": {
                  schema: zodSchema(PlanRequiredErrorSchema).jsonSchema,
                },
              },
            },
          },
        },
      },
    ]),
  ),
};

function json(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function swiftCase(value: string): string {
  return value.replace(/[-_](.)/g, (_, char: string) => char.toUpperCase());
}

function swiftString(value: string): string {
  return JSON.stringify(value);
}

function makeSwiftContract(tokens: BrandTokens): string {
  const accessCases = (Object.keys(ACCESS) as AccessFeature[])
    .map((feature) => `    case ${swiftCase(feature)} = ${swiftString(feature)}`)
    .join("\n");
  const requirements = (Object.entries(ACCESS) as [AccessFeature, Plan][])
    .map(([feature, plan]) => `        .${swiftCase(feature)}: .${plan},`)
    .join("\n");
  const destinationCases = navigationContract.primary
    .map(({ id }) => `    case ${swiftCase(id)}`)
    .join("\n");
  const destinationSwitch = navigationContract.primary
    .map(
      ({ id, route, label, iosSymbol, accessFeature }) => `        case .${swiftCase(id)}:
            return ProductDestinationMetadata(
                route: ${swiftString(route)},
                label: ${swiftString(label)},
                systemImage: ${swiftString(iosSymbol)},
                accessFeature: ${accessFeature ? `.${swiftCase(accessFeature)}` : "nil"}
            )`,
    )
    .join("\n");
  const storekitProducts = Object.entries(APP_STORE_PRODUCTS)
    .map(([name, product]) => `    static let ${name} = ${swiftString(product.id)}`)
    .join("\n");
  const storekitProductNames = Object.keys(APP_STORE_PRODUCTS)
    .map((name) => name)
    .join(", ");

  return `// Generated by athopia-web/scripts/generate-parity-contracts.ts.
// Do not edit manually.

import Foundation

enum AthopiaBrandTokens {
    static let green = ${swiftString(tokens.brand.green)}
    static let greenOnDark = ${swiftString(tokens.brand.greenOnDark)}
    static let successLight = ${swiftString(tokens.brand.successLight)}
    static let successDark = ${swiftString(tokens.brand.successDark)}
    static let destructiveLight = ${swiftString(tokens.brand.destructive)}
    static let destructiveDark = ${swiftString(tokens.dark.destructive)}

    static let backgroundLight = ${swiftString(tokens.light.background)}
    static let backgroundDark = ${swiftString(tokens.dark.background)}
    static let foregroundLight = ${swiftString(tokens.light.foreground)}
    static let foregroundDark = ${swiftString(tokens.dark.foreground)}
    static let surfaceLight = ${swiftString(tokens.light.surface)}
    static let surfaceDark = ${swiftString(tokens.dark.surface)}
    static let cardLight = ${swiftString(tokens.light.card)}
    static let cardDark = ${swiftString(tokens.dark.card)}
    static let elevatedDark = ${swiftString(tokens.dark.elevated)}
    static let mutedForegroundLight = ${swiftString(tokens.light.mutedForeground)}
    static let mutedForegroundDark = ${swiftString(tokens.dark.mutedForeground)}
    static let borderLight = ${swiftString(tokens.light.border)}
    static let borderDark = ${swiftString(tokens.dark.border)}

    static let spacingGrid = ${tokens.spacing.grid}
    static let spacingFineStep = ${tokens.spacing.fineStep}
    static let touchTargetMinimum = ${tokens.spacing.touchTargetMin}
    static let radii = [${tokens.radius.join(", ")}]
    static let durationFastMilliseconds = ${tokens.motion.durationFastMs}
    static let durationBaseMilliseconds = ${tokens.motion.durationBaseMs}
    static let usesBounce = ${tokens.motion.bounce}
}

enum UserPlan: Int, Codable, CaseIterable {
    case free = 0
    case pro = 1
    case elite = 2
}

enum AppStoreProductID {
${storekitProducts}
    static let all = [${storekitProductNames}]
}

enum AccessFeature: String, Codable, CaseIterable {
${accessCases}
}

enum ProductAccess {
    static let requirements: [AccessFeature: UserPlan] = [
${requirements}
    ]

    static func canAccess(_ feature: AccessFeature, plan: UserPlan) -> Bool {
        guard let requiredPlan = requirements[feature] else { return false }
        return plan.rawValue >= requiredPlan.rawValue
    }
}

struct ProductDestinationMetadata {
    let route: String
    let label: String
    let systemImage: String
    let accessFeature: AccessFeature?
}

enum ProductDestination: String, CaseIterable {
${destinationCases}

    var metadata: ProductDestinationMetadata {
        switch self {
${destinationSwitch}
        }
    }
}
`;
}

async function assertOrWrite(file: string, content: string): Promise<void> {
  if (!checkOnly) {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content, "utf8");
    return;
  }

  const current = await readFile(file, "utf8").catch(() => "");
  if (current !== content) {
    throw new Error(`Generated contract is stale: ${file}`);
  }
}

async function main(): Promise<void> {
  const brandTokens = JSON.parse(await readFile(brandTokensFile, "utf8")) as BrandTokens;

  await Promise.all([
    assertOrWrite(path.join(generatedDir, "navigation.json"), json(navigationContract)),
    assertOrWrite(path.join(generatedDir, "access.json"), json(accessContract)),
    assertOrWrite(path.join(generatedDir, "storekit.json"), json(storekitContract)),
    assertOrWrite(path.join(generatedDir, "design-tokens.json"), json(brandTokens)),
    assertOrWrite(path.join(generatedDir, "openapi.json"), json(openapiContract)),
    assertOrWrite(iosGeneratedFile, makeSwiftContract(brandTokens)),
  ]);

  console.log(checkOnly ? "Parity contracts are current." : "Parity contracts generated.");
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
