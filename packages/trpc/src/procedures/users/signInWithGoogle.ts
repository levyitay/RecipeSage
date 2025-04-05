import { prisma, SessionDTO } from "@recipesage/prisma";
import { publicProcedure } from "../../trpc";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { TRPCError } from "@trpc/server";
import {
  SessionType,
  generateSession,
  config,
} from "@recipesage/util/server/general";

export const signInWithGoogle = publicProcedure
  .input(
    z.object({
      clientId: z.string(),
      credential: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    if (!config.google.gsi.clientId || !config.google.gsi.clientSecret) {
      throw new Error("GSI clientId or clientSecret missing");
    }

    const client = new OAuth2Client(
      config.google.gsi.clientId,
      config.google.gsi.clientSecret,
    );
    const ticket = await client.verifyIdToken({
      idToken: input.credential,
      audience: input.clientId,
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) {
      throw new TRPCError({
        message: "Invalid clientId or credential",
        code: "BAD_REQUEST",
      });
    }

    const user = await prisma.user.upsert({
      where: {
        email: email.toLowerCase(),
      },
      create: {
        name: email.split("@")[0],
        email: email.toLowerCase(),
      },
      update: {
        lastLogin: new Date(),
      },
    });

    const session = await generateSession(user.id, SessionType.User);

    return {
      token: session.token,
      userId: session.userId,
      email: user.email,
    } satisfies SessionDTO;
  });
