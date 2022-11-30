import dotenv from "dotenv";
import { app } from "./app";

dotenv.config();

const env = process.env.ENVIRONMENT;
const host = process.env.HOST;
const port = process.env.PORT;

app.listen(port, () => {
  console.log(`⚡️[env]: Set the ${env} environment`);
  console.log(`⚡️[server]: Server is running at https://${host}:${port}`);
});
