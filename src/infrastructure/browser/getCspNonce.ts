/**
 * Tauri replaces __TAURI_STYLE_NONCE__ tokens in the built HTML with a
 * unique random nonce at page-load time and adds the nonce to the CSP
 * `style-src` directive.  In dev mode (Vite dev server) the token stays
 * as the literal placeholder, so we return None and let Emotion create
 * `<style>` tags without a nonce attribute.
 */

import * as O from "fp-ts/Option";
import { pipe } from "fp-ts/function";

const TAURI_STYLE_NONCE_PLACEHOLDER = "__TAURI_STYLE_NONCE__";

export const getCspNonce = (): O.Option<string> =>
  pipe(
    O.fromNullable(document.querySelector('meta[name="csp-nonce"]')),
    O.chain((meta) => O.fromNullable(meta.getAttribute("content"))),
    O.filter((content) => content.length > 0),
    O.filter((content) => content !== TAURI_STYLE_NONCE_PLACEHOLDER),
  );
