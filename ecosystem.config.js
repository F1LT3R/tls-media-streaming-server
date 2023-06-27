module.exports = {
  apps : [
      {
        name: "tls-streaming-media-server",
        script: "./server/index.js",
        watch: true,
        env: {
          "NODE_ENV": "development",
          "DOMAIN": "example.com",
          "SERVE": "site"
        }
      }
  ]
};