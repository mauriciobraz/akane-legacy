import { resolve } from "path";
import { DataSource } from "typeorm";

import { EnvVars } from "../utils/env-vars";

export const AkaneDataSource = new DataSource({
  type: "postgres",
  synchronize: true,
  url: EnvVars.getString("DATABASE_URL"),
  entities: [resolve(__dirname, "entities", "**", "*.{ts, js}")],
});
