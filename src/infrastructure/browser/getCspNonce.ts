/**
 * Tauri replaces __TAURI_STYLE_NONCE__ tokens in the built HTML with a
 * unique random nonce at page-load time and adds the nonce to the CSP
 * `style-src` directive. In dev mode the placeholder remains unchanged,
 * so we only expose a nonce when the build runtime has already resolved it.
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
