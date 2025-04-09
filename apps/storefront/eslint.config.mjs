import nextConfig from "@fwd/eslint/next";

export default [
  ...nextConfig,
  {
    ignores: [".next/**/*", "global.d.ts"],
  },
];
