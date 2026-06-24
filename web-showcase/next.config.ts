import type { NextConfig } from "next";

const config: NextConfig = {
  outputFileTracingIncludes: {
    "/*": ["src/data/palettes.db"],
  },
};

export default config;
