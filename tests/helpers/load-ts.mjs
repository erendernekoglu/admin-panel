import { readFile } from "node:fs/promises";
import path from "node:path";
import { SourceTextModule } from "node:vm";
import ts from "typescript";

/**
 * Minimal TypeScript ESM loader for node:test.
 *
 * The app sources are written for a bundler (extensionless relative imports),
 * so tests transpile them with the project's TypeScript dependency and link the
 * module graph themselves. Each loader owns its module cache, which lets a test
 * load the same source under demo and API configuration independently.
 */
export function createTsLoader({ env = { VITE_DATA_MODE: "demo" } } = {}) {
  const cache = new Map();

  async function resolveFile(specifier, referrer) {
    const base = path.resolve(path.dirname(referrer), specifier);
    const candidates = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
    for (const candidate of candidates) {
      try {
        await readFile(candidate);
        return candidate;
      } catch {
        // Try the next candidate.
      }
    }
    throw new Error(`Cannot resolve "${specifier}" from ${referrer}`);
  }

  async function loadModule(specifier, referrer) {
    const filePath = await resolveFile(specifier, referrer);
    const cached = cache.get(filePath);
    if (cached) return cached;

    const source = await readFile(filePath, "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: filePath,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
        verbatimModuleSyntax: false,
      },
    });

    const module = new SourceTextModule(outputText, {
      identifier: filePath,
      initializeImportMeta(meta) {
        meta.env = env;
        meta.url = `file://${filePath}`;
      },
    });
    cache.set(filePath, module);
    await module.link((specifier_, referencing) => loadModule(specifier_, referencing.identifier));
    await module.evaluate();
    return module;
  }

  return (entry) => loadModule(entry, path.join(process.cwd(), "test-entry.js"));
}
