import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { SWIFT_MODEL_CONTRACTS } from "./api-schemas";

const modelsDir = path.resolve(
  process.cwd(),
  "..",
  "athopia-ios",
  "AthopiaApp",
  "AthopiaApp",
  "Models",
);

const swiftSource = readdirSync(modelsDir)
  .filter((file) => file.endsWith(".swift"))
  .map((file) => readFileSync(path.join(modelsDir, file), "utf8"))
  .join("\n");

interface SwiftField {
  name: string;
  optional: boolean;
}

/** Plockar ut de lagrade properties som Codable faktiskt avkodar. */
function parseSwiftStruct(source: string, structName: string): SwiftField[] {
  const start = source.search(new RegExp(`struct\\s+${structName}\\s*:`));
  assert.notEqual(start, -1, `Hittade inte struct ${structName} i iOS-modellerna`);

  // Läs balanserat block från första { efter structnamnet.
  const open = source.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) {
      end = i;
      break;
    }
  }
  const body = source.slice(open, end);

  const fields: SwiftField[] = [];
  // `let name: Type` — computed properties (`var x: T { … }`) avkodas inte.
  const pattern = /^\s*let\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^\n=]+)$/gm;
  for (const match of body.matchAll(pattern)) {
    // Strippa radkommentar och CR: `String?   // AI summary\r` → `String?`
    // (`.` matchar inte \r i JS — utan [\s\S] överlever kommentaren på CRLF-filer.)
    const type = match[2].replace(/\/\/[\s\S]*$/, "").trim();
    fields.push({ name: match[1], optional: type.endsWith("?") });
  }
  return fields;
}

/** Är fältet frånvarande eller null i något giltigt serversvar? */
function mayBeMissingOrNull(schema: z.ZodTypeAny): boolean {
  return schema.isOptional() || schema.isNullable();
}

const snakeCase = (value: string) =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);

/**
 * iOS avkodar med `.convertFromSnakeCase`, så en Swift-property `homeTeamName`
 * matchar wire-nyckeln `home_team_name`. Routes som svarar med råa DB-rader
 * beskrivs därför i snake_case i schemat — slå upp båda formerna.
 */
function lookupField(shape: z.ZodRawShape, swiftName: string): z.ZodTypeAny | undefined {
  return shape[swiftName] ?? shape[snakeCase(swiftName)];
}

for (const { swiftStruct, schema } of SWIFT_MODEL_CONTRACTS) {
  const shape = (schema as unknown as z.ZodObject<z.ZodRawShape>).shape;
  const swiftFields = parseSwiftStruct(swiftSource, swiftStruct);

  test(`${swiftStruct} avkodar bara fält servern skickar`, () => {
    for (const field of swiftFields) {
      assert.ok(
        lookupField(shape, field.name) !== undefined,
        `${swiftStruct}.${field.name} finns inte i serverkontraktet — iOS avkodar ett fält som aldrig skickas`,
      );
    }
  });

  test(`${swiftStruct} är optional där servern kan utelämna eller nulla`, () => {
    for (const field of swiftFields) {
      const fieldSchema = lookupField(shape, field.name);
      if (!fieldSchema) continue;
      if (mayBeMissingOrNull(fieldSchema) && !field.optional) {
        assert.fail(
          `${swiftStruct}.${field.name} är non-optional i Swift men kan vara null/saknas i svaret — decoden av hela svaret failar tyst`,
        );
      }
    }
  });
}
