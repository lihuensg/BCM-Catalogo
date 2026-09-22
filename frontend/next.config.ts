import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  // Repository-wide instructions are maintained in the root AGENTS.md.
  agentRules: false
};
export default config;
