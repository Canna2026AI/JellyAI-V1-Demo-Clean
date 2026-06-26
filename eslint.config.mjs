import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "public/legacy/**", "core/**", "data/**", "modules/**", "app.js"],
  },
  ...nextVitals,
  ...nextTypescript,
];

export default eslintConfig;
