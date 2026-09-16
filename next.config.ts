import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Stop `next dev` from regenerating AGENTS.md / CLAUDE.md on every start.
  agentRules: false,
}

export default nextConfig
