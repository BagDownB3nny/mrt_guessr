module.exports = {
  apps: [{
    name: "mrt-api",
    script: ".venv/bin/uvicorn",
    args: "main:app --host 0.0.0.0 --port 57401",
    cwd: "/Users/aaron/projects/mrt_guessr/backend",
    interpreter: "none",
    autorestart: true,
    watch: false,
    env: {
      PATH: "/Users/aaron/projects/mrt_guessr/backend/.venv/bin:/usr/local/bin:/usr/bin:/bin",
      VIRTUAL_ENV: "/Users/aaron/projects/mrt_guessr/backend/.venv",
    }
  }]
};
