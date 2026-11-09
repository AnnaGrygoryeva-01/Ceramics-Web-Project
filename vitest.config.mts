import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const SERVER_TESTS = ["src/server/**/*.test.ts", "src/app/api/**/*.test.ts"];

// Two projects because src/test/setup.ts needs a browser-like DOM at the top level,
// which the backend tests neither have nor want
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "app",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          exclude: [...configDefaults.exclude, ...SERVER_TESTS],
        },
      },
      {
        extends: true,
        test: { name: "server", environment: "node", include: SERVER_TESTS },
      },
    ],
  },
});
