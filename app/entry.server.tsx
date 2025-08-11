import { RemixServer } from "react-router";
import type { EntryContext } from "@remix-run/cloudflare";
import { renderToReadableStream } from "react-dom/server";

export default function handleRequest(
  request: Request,
  statusCode: number,
  headers: Headers,
  context: EntryContext
) {
  return renderToReadableStream(
    <RemixServer context={context} url={request.url} />,
    { status: statusCode, headers }
  );
}
