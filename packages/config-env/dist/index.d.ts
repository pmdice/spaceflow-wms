declare const env: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    OPENAI_API_KEY: string;
    NODE_ENV: "development" | "test" | "production";
};

export { env };
