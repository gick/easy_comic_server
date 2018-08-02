module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    // First application
    {
      name: 'comicServer',
      script: 'server.js',
      env: {
        NODE_ENV: 'dev',
        PORT: 80
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 443
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'gick',
      key: '/home/gick/.ssh/gickjessie_rsa',
      host: '51.15.135.233',
      ref: 'origin/master',
      repo: 'git@github.com:gick/easy_comic_server.git',
      path: '/home/gick/easy-comic',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      env: {
        "NODE_ENV": "production"
      }

    },
    dev: {
      user: 'gick',
      key: '/home/gick/.ssh/gickjessie_rsa',
      host: '51.15.135.233',
      ref: 'origin/master',
      repo: 'git@github.com:gick/easy_comic_server.git',
      path: '/home/gick/easy-comic-dev',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js',
    }
  }
};
