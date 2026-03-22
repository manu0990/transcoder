import { app } from "./app";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger";
import { env } from "./configs/envs";

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      requestInterceptor: (req: { headers: { Authorization: string; }; }) => {
        if (req.headers.Authorization) {
          // If user entered only token, add Bearer
          if (!req.headers.Authorization.startsWith("Bearer ")) {
            req.headers.Authorization = `Bearer ${req.headers.Authorization}`;
          }
        }
        return req;
      },
    },
  })
);

app.listen(Number(env.port), "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${env.port}`);
});
