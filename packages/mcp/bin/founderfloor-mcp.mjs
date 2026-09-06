#!/usr/bin/env node
// Runs the TypeScript entry with type stripping on Node 22+ (default on 23+).
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const here = dirname(fileURLToPath(import.meta.url));
const major = Number(process.versions.node.split(".")[0]);
const flags = major >= 23 ? ["--no-warnings"] : ["--experimental-strip-types", "--no-warnings"];
const child = spawn(process.execPath, [...flags, join(here, "..", "src", "cli.ts")], { stdio: "inherit", env: process.env });
child.on("exit", (code) => process.exit(code ?? 0));
