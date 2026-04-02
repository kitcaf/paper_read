import { Hono } from "hono";

import {
  createScreeningQuerySchema,
  listScreeningQueriesQuerySchema,
  listScreeningResultsQuerySchema
} from "./screening.schema.js";
import {
  createScreeningQuery,
  getScreeningQuery,
  getScreeningResults,
  listScreeningQueries
} from "./screening.service.js";

export const screeningRouter = new Hono()
  .get("/queries", async (context) => {
    const query = listScreeningQueriesQuerySchema.parse(context.req.query());
    return context.json(await listScreeningQueries(query));
  })
  .post("/queries", async (context) => {
    const body = createScreeningQuerySchema.parse(await context.req.json());
    const screeningQuery = await createScreeningQuery(body);

    return context.json(screeningQuery, 201);
  })
  .get("/queries/:queryId", async (context) => {
    const screeningQuery = await getScreeningQuery(context.req.param("queryId"));
    if (!screeningQuery) {
      return context.json({ message: "Screening query not found" }, 404);
    }

    return context.json(screeningQuery);
  })
  .get("/queries/:queryId/results", async (context) => {
    const screeningQuery = await getScreeningQuery(context.req.param("queryId"));
    if (!screeningQuery) {
      return context.json({ message: "Screening query not found" }, 404);
    }

    const query = listScreeningResultsQuerySchema.parse(context.req.query());

    return context.json(await getScreeningResults(screeningQuery.id, query));
  });
