import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    // Global ignores
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.turbo/**",
            "**/coverage/**",
            "packages/database/generated/**",
        ],
    },

    // Base JS rules
    js.configs.recommended,

    // TypeScript rules
    ...tseslint.configs.recommended.map((config) => ({
        ...config,
        files: ["**/*.ts", "**/*.tsx"],
    })),
];