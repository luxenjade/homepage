"use strict";

/**
 * _lib/cors.js
 * Shared CORS headers and OPTIONS handler.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

function handleOptions(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  return null;
}

module.exports = { CORS, handleOptions };
