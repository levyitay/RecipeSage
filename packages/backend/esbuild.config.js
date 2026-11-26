const { sentryEsbuildPlugin } = require("@sentry/esbuild-plugin");

const sourcemap = (() => {
  if (process.env.SOURCEMAP_UPLOAD === "true") {
    return "external";
  }
  if (process.env.NODE_ENV === "development") {
    return "inline";
  }
  return undefined;
})();

module.exports = {
  sourcemap,
  keepNames: true,
  plugins: [
    sentryEsbuildPlugin({
      disable: process.env.SOURCEMAP_UPLOAD !== "true",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: "recipesage",
      project: "recipesage-api",
    }),
  ],
};
