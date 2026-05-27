import type { ApolloServerPlugin } from "@apollo/server";
import { graphqlOperationDuration, graphqlErrorsTotal } from "./registry.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const metricsPlugin: ApolloServerPlugin<any> = {
  async requestDidStart() {
    const start = process.hrtime.bigint();

    return {
      async willSendResponse({ request }) {
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
        const operationName = request.operationName ?? "unknown";
        graphqlOperationDuration.observe({ operation_name: operationName }, durationSeconds);
      },

      async didEncounterErrors({ request }) {
        const operationName = request.operationName ?? "unknown";
        graphqlErrorsTotal.inc({ operation_name: operationName });
      },
    };
  },
};
