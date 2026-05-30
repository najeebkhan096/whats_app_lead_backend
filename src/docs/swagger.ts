import swaggerJsdoc from 'swagger-jsdoc';
import config from '@config/env';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lead Finder SaaS API',
      version: '1.0.0',
      description: 'Lead Finder - Google Maps Business Scraper and Lead Generator API',
      contact: {
        name: 'Lead Finder Team',
        url: 'https://leadfinder.app',
      },
    },
    servers: [
      {
        url: config.API_BASE_URL,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  // Path to the API docs
  apis: [
    path.join(__dirname, '../routes/*.ts'),
    path.join(__dirname, '../app.ts'),
  ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
