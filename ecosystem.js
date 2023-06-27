module.exports = {
  apps : [
      {
        name: "tls-streaming-media-server",
        script: "./server/index.js",
        watch: true,
        env: {
          "NODE_ENV": "production",
          "DOMAIN": "example.com"
        }
      }
  ]
};