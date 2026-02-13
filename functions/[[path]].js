import worker from "../src/index.js";

/**
 * Cloudflare Pages Function Adapter
 * Routes all Pages requests to the existing Worker `fetch` handler.
 * This allows us to reuse the exact same code structure on Pages.
 */
export const onRequest = async (context) => {
    return worker.fetch(context.request, context.env, context);
};
