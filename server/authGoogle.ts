import type { Express, Request, Response } from "express";
import axios from "axios";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { users, userAccessProvisions, teamMembers } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getGoogleClientId(): string {
  return (process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID || "").trim();
}

function getGoogleClientSecret(): string {
  return (process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET || "").trim();
}

function getRedirectUri(req: Request): string {
  const host = req.get("host") || "localhost:3000";
  const protocol = req.protocol === "https" || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${protocol}://${host}/api/auth/google/callback`;
}

/**
 * Valida se um e-mail do Google está autorizado a acessar o portal do Estudo BNDES.
 */
export async function getAuthorizedUserByEmail(email: string, nameFallback?: string) {
  const normalized = email.trim().toLowerCase();
  const dbInstance = await db.requireDb();

  // 1. Usuário já existente
  const existingUsers = await dbInstance
    .select()
    .from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${normalized})`)
    .limit(1);

  if (existingUsers[0]) {
    return {
      authorized: true as const,
      user: existingUsers[0],
    };
  }

  // 2. Usuário pré-cadastrado em provisions
  const provisions = await dbInstance
    .select()
    .from(userAccessProvisions)
    .where(sql`LOWER(${userAccessProvisions.email}) = LOWER(${normalized})`)
    .limit(1);

  if (provisions[0]) {
    const prov = provisions[0];
    const openId = `google_${prov.email.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    const [created] = await dbInstance
      .insert(users)
      .values({
        openId,
        name: prov.name || nameFallback || "Participante do Estudo",
        email: prov.email,
        role: prov.role,
        appRole: prov.appRole,
        accessStatus: "ativo",
        loginMethod: "google",
        lastSignedIn: new Date(),
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: prov.name || nameFallback,
          email: prov.email,
          lastSignedIn: new Date(),
          accessStatus: "ativo",
        },
      })
      .returning();

    return {
      authorized: true as const,
      user: created,
    };
  }

  // 3. Integrante da equipe cadastrado
  const members = await dbInstance
    .select()
    .from(teamMembers)
    .where(sql`LOWER(${teamMembers.email}) = LOWER(${normalized})`)
    .limit(1);

  if (members[0]) {
    const member = members[0];
    const openId = `google_${member.email!.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    const role = member.name.includes("Floriano") ? ("admin" as const) : ("user" as const);
    const appRole = member.groupRole === "coordenador" ? ("coordenador" as const) : ("executor" as const);

    const [created] = await dbInstance
      .insert(users)
      .values({
        openId,
        name: member.name || nameFallback || "Participante do Estudo",
        email: member.email,
        role,
        appRole,
        accessStatus: "ativo",
        loginMethod: "google",
        lastSignedIn: new Date(),
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: member.name,
          email: member.email,
          lastSignedIn: new Date(),
          accessStatus: "ativo",
        },
      })
      .returning();

    return {
      authorized: true as const,
      user: created,
    };
  }

  // 4. E-mail de Administrador Especial
  if (normalized === "admin@estudo.ufrj.br" || normalized === "cassianomarins@gmail.com") {
    const openId = `google_${normalized.replace(/[^a-zA-Z0-9_]/g, "_")}`;
    const [created] = await dbInstance
      .insert(users)
      .values({
        openId,
        name: nameFallback || "Administrador do Estudo",
        email: normalized,
        role: "admin",
        appRole: "administrador",
        accessStatus: "ativo",
        loginMethod: "google",
        lastSignedIn: new Date(),
      })
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          role: "admin",
          appRole: "administrador",
          accessStatus: "ativo",
          lastSignedIn: new Date(),
        },
      })
      .returning();

    return {
      authorized: true as const,
      user: created,
    };
  }

  return {
    authorized: false as const,
    email: normalized,
  };
}

export function registerGoogleAuthRoutes(app: Express) {
  // Início do fluxo Google OAuth
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      res.redirect(302, "/login?error=missing_google_config");
      return;
    }

    const redirectUri = getRedirectUri(req);
    const state = Math.random().toString(36).substring(2);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      prompt: "select_account",
      state,
    });

    res.redirect(302, `${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Retorno do Google OAuth
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    const errorParam = req.query.error as string | undefined;

    if (errorParam || !code) {
      console.warn("[Google Auth] Error or code missing in callback:", errorParam);
      res.redirect(302, `/login?error=google_failed&details=${encodeURIComponent(errorParam || "no_code")}`);
      return;
    }

    const clientId = getGoogleClientId();
    const clientSecret = getGoogleClientSecret();
    const redirectUri = getRedirectUri(req);

    if (!clientId || !clientSecret) {
      res.redirect(302, "/login?error=missing_google_config");
      return;
    }

    try {
      // 1. Troca do código por tokens
      const tokenRes = await axios.post(
        GOOGLE_TOKEN_URL,
        new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
        {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }
      );

      const accessToken = tokenRes.data.access_token;
      if (!accessToken) {
        throw new Error("No access token returned from Google");
      }

      // 2. Busca dos dados do usuário
      const userInfoRes = await axios.get(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const googleUser = userInfoRes.data;
      const email = googleUser?.email;
      const name = googleUser?.name || "Participante do Estudo";

      if (!email) {
        res.redirect(302, "/login?error=no_email_from_google");
        return;
      }

      // 3. Verificação de autorização na equipe do Estudo BNDES
      const authResult = await getAuthorizedUserByEmail(email, name);

      if (!authResult.authorized) {
        console.warn(`[Google Auth] Unauthorized email attempt: ${email}`);
        res.redirect(302, `/login?error=unauthorized&email=${encodeURIComponent(email)}`);
        return;
      }

      const user = authResult.user;

      // 4. Criação da sessão JWT e Cookie
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      res.redirect(302, "/");
    } catch (err: any) {
      console.error("[Google Auth] Callback processing error:", err?.response?.data || err?.message || err);
      res.redirect(302, `/login?error=auth_failed`);
    }
  });
}
