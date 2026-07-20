import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const authUrl = process.env.BETTER_AUTH_URL;

if (!authUrl) {
  throw new Error("BETTER_AUTH_URL is not configured.");
}

const response = await fetch(new URL("/api/auth/jwks", authUrl));

if (!response.ok) {
  throw new Error(
    `Could not fetch Better Auth JWKS (${response.status} ${response.statusText}).`,
  );
}

const jwks = await response.json();

if (
  !jwks ||
  typeof jwks !== "object" ||
  !Array.isArray(jwks.keys) ||
  jwks.keys.length === 0
) {
  throw new Error("Better Auth returned an invalid or empty JWKS.");
}

const encodedJwks = Buffer.from(JSON.stringify(jwks)).toString("base64");
const dataUri = `data:application/json;base64,${encodedJwks}`;
const convexCli = fileURLToPath(
  new URL("../node_modules/.bin/convex", import.meta.url),
);
const result = spawnSync(
  convexCli,
  ["env", "set", "BETTER_AUTH_JWKS", dataUri, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

console.log("Synced Better Auth JWKS to Convex.");