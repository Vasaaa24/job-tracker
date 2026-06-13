import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { Job } from "./statuses";

let _sql: NeonQueryFunction<false, false> | null = null;

/** Líná inicializace DB klienta — neběží při buildu, jen za běhu API. */
export function sql(strings: TemplateStringsArray, ...params: any[]) {
  if (!_sql) {
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      "";
    if (!connectionString) {
      throw new Error(
        "Chybí DATABASE_URL / POSTGRES_URL — připoj databázi ve Vercelu (Storage → Neon)."
      );
    }
    _sql = neon(connectionString);
  }
  return _sql(strings, ...params);
}

let tableReady = false;

/** Vytvoří tabulku, pokud neexistuje (idempotentní, levné). */
export async function ensureTable() {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id        TEXT PRIMARY KEY,
      title     TEXT NOT NULL,
      company   TEXT NOT NULL,
      link      TEXT NOT NULL DEFAULT '',
      note      TEXT NOT NULL DEFAULT '',
      status    TEXT NOT NULL DEFAULT 'todo',
      grp       TEXT NOT NULL DEFAULT 'basic',
      comments  JSONB NOT NULL DEFAULT '[]'::jsonb,
      created   BIGINT NOT NULL
    )
  `;
  tableReady = true;
}

/** Převod DB řádku (grp) na aplikační objekt (group). */
export function rowToJob(r: any): Job {
  return {
    id: r.id,
    title: r.title,
    company: r.company,
    link: r.link || "",
    note: r.note || "",
    status: r.status,
    group: r.grp === "top" ? "top" : "basic",
    comments: Array.isArray(r.comments) ? r.comments : [],
    created: Number(r.created),
  };
}
