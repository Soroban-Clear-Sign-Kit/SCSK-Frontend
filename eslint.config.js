import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "node_modules/", "example/", "vue/"] },
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  reactHooks.configs.flat.recommended,
);
