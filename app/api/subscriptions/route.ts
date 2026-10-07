// Newsletter persistence and consent handling will be implemented in RJS-04/05.
export const POST = async (): Promise<Response> =>
  Response.json(
    { error: "Newsletter signup is not open yet." },
    { status: 503 },
  );
