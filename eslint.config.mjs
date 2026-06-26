import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "public/legacy/**", "public/workspace/**", "core/**", "data/**", "modules/**", "app.js"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
