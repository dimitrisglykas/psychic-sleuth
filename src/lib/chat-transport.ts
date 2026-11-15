// Convert safe server error objects into the message expected by the chat UI.
export async function interrogationFetch(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.ok) return response;
  let message = "The conversation could not connect. Your case progress is saved.";
  try {
    const body: unknown = await response.clone().json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") message = body.message;
  } catch { /* Unstructured connection failure: retain the safe fallback. */ }
  return new Response(message, { status: response.status, headers: { "Content-Type": "text/plain" } });
}