import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";

import "dotenv/config";
import { token } from "morgan";

//initialize arcjet

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }), //shiled protects the website from common attacks such as SQL injections, cross site scripting, CSRF, etc.
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }), //detects bots based on behavior and characteristics. Doesnt block search engines https://arcjet.com/bot-list
    tokenBucket({
      mode: "LIVE",
      refillRate: 5, //number of tokens to add per interval (5 every 10 seconds = 30 per minute with a max of 10 at any time)
      interval: 10, //interval in seconds
      capacity: 10, //max number of tokens in the bucket
    }),
  ],
});

// rate limiting middleware: max 30 requests per minute per IP so that our server doesnt crash.
