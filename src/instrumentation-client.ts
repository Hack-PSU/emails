import posthog from "posthog-js";

posthog.init("phc_d5zDFPQokbIKMjFyawWWEvGUzTK4PzOn6ae1xxXuaX3", {
  api_host: "/ingest",
  ui_host: "https://us.posthog.com",
  defaults: "2025-05-24",
  capture_exceptions: true, // This enables capturing exceptions using Error Tracking
  debug: process.env.NODE_ENV === "development",
});
