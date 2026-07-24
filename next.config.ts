import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Scope Studio's pipeline uses native/CLI-spawning packages that must not be
  // bundled by the server compiler — keep them as runtime requires.
  serverExternalPackages: [
    "playwright",
    "@anthropic-ai/claude-agent-sdk",
    "@octokit/rest",
    "@vercel/sdk",
  ],
};

export default nextConfig;
