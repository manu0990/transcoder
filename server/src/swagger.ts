import path from "path";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "@/configs/envs";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Video Transcoder",
      version: "1.0.0",
      description: "convert video resolution",
    },
    servers: [
      {
        url: `http://localhost:${env.port}`,
      },
    ],
    
     components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // optional but recommended
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],

  },
  apis: [
    path.resolve(process.cwd(), "src/routes/*.ts"),
    path.resolve(process.cwd(), "dist/routes/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
