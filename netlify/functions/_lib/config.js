"use strict";

/**
 * _lib/config.js
 * Supabase and Site configuration.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

const SITE_CONFIG = {
  accent: "#e99700",
  accentDark: "#f5be4c",
  ui: {
    siteTitle: "Docs | luxenjade",
    ownerLabel: "luxenjade",
    heroLabel: "Developer Notes",
    heroTitle: "luxenjade<br><em>Docs.</em>",
    heroBio:
      "Here are some notes and documentation related to my projects, experiments, and learnings. This is a space for sharing insights, guides, and technical details about my work.",
    postsHeading: "Documentations",
    footerText: "© 2026 luxenjade",
    avatarUrl: "https://res.cloudinary.com/dv2sf0nxh/image/upload/q_auto/f_auto/v1781694960/luxenjade-landscape_zblvbz.jpg",
    links: [],
  },
};

module.exports = { SUPABASE_URL, SUPABASE_KEY, SITE_CONFIG };
