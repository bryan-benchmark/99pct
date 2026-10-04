export async function readWorkspaceJsonObject(request: Request, maxBytes: number): Promise<{ body: Record<string, unknown>; error?: never } | { body?: never; error: Response }> {
  const tooLong = () => Response.json({ error: "Request is too long." }, { status: 413 });
  const invalid = () => Response.json({ error: "Invalid request." }, { status: 400 });
  const contentLength = request.headers.get("content-length");
  if (contentLength && /^\d+$/.test(contentLength) && Number(contentLength) > maxBytes) return { error: tooLong() };
  if (!request.body) return { error: invalid() };
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0;
  let raw = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        return { error: tooLong() };
      }
      raw += decoder.decode(value, { stream: true });
    }
    raw += decoder.decode();
    const body: unknown = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body)) return { error: invalid() };
    return { body: body as Record<string, unknown> };
  } catch {
    await reader.cancel().catch(() => undefined);
    return { error: invalid() };
  } finally {
    reader.releaseLock();
  }
}
