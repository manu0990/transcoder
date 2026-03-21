import dotenv from "dotenv";
dotenv.config();
import { app } from "./index";

const port = process.env.PORT;
if(!port) console.log("'PORT' is not defined in environment variables");

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${port}`);
});