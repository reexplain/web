import "server-only";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReturnType,
} from "convex/server";

const getConvexServerOptions = () => {
  const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const deployKey = process.env.CONVEX_DEPLOY_KEY;

  if (!deploymentUrl) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }

  if (!deployKey) {
    throw new Error("CONVEX_DEPLOY_KEY is not configured.");
  }

  return {
    url: deploymentUrl,
    adminToken: deployKey,
  };
};

export const queryConvexInternal = async <
  Query extends FunctionReference<"query", "internal">,
>(
  query: Query,
  args: FunctionArgs<Query>,
): Promise<FunctionReturnType<Query>> => {
  const publicReference = query as unknown as FunctionReference<"query">;

  return fetchQuery(publicReference, args, getConvexServerOptions()) as Promise<
    FunctionReturnType<Query>
  >;
};

export const mutateConvexInternal = async <
  Mutation extends FunctionReference<"mutation", "internal">,
>(
  mutation: Mutation,
  args: FunctionArgs<Mutation>,
): Promise<FunctionReturnType<Mutation>> => {
  const publicReference = mutation as unknown as FunctionReference<"mutation">;

  return fetchMutation(publicReference, args, getConvexServerOptions()) as Promise<
    FunctionReturnType<Mutation>
  >;
};