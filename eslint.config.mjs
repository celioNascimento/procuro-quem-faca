import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
// Se for eslint.config.mjs
const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    "rules": {
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];

// Se for eslint.config.mjs


export default eslintConfig;
