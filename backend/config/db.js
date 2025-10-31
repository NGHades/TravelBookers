import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env; //define variables from env in this file

// create a SQL connection using env variables above
export const sql = neon(
  `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require`
);

// this SQL function exported is used as a tagged template literal, which allows you to write SQL queries separated froom the front end.
// this is safer because it prevents SQL injection attacks
