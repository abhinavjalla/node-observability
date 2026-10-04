import { Pool } from "pg";

export const pool = new Pool({
  host: "postgres",
  port: Number(5432),
  database: "observability",
  user: "postgres",
  password: "postgres",
  max: 10,
});