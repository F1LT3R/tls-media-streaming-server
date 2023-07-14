module.exports = {
  apps : [
      {
        name: "tls-streaming-media-server",
        script: "./server/index.js",
        watch: true,
        env: {
          "NODE_ENV": "development",
          "DOMAIN": "example.com",
          "SECRETS_DIR": ".secrets",
          "SERVE_DIR": "../weyersmacdonald.com"
        }
      }
  ]
};
