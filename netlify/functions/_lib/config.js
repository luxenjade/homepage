"use strict";

/**
 * _lib/config.js
 * Supabase configuration for Netlify Functions.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

class PostgrestQuery {
  constructor(table) {
    this.table = table;
    this.params = new URLSearchParams();
    this.expectSingle = false;
  }

  select(columns) {
    this.params.set("select", columns);
    return this;
  }

  eq(column, value) {
    this.params.set(column, `eq.${value}`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.params.set("order", `${column}.${ascending ? "asc" : "desc"}`);
    return this;
  }

  single() {
    this.expectSingle = true;
    return this;
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  async execute() {
    const url = new URL(`/rest/v1/${this.table}`, SUPABASE_URL);
    url.search = this.params.toString();

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Accept: this.expectSingle ? "application/vnd.pgrst.object+json" : "application/json",
      },
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : null;

    if (!response.ok) {
      return { data: null, error: body || { message: response.statusText } };
    }

    return { data: body, error: null };
  }
}

const supabase = {
  from(table) {
    return new PostgrestQuery(table);
  },
};

const TABLES = {
  DOCS_PUBLIC: "posts_public",
  DOCS_PRIVATE: "posts_private",
  DOCS_PASSWORD: "posts_password",
};

module.exports = { supabase, TABLES };
