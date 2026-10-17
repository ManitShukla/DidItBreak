import { FileRiskAnalysis } from '../services/gemini';

export interface MockScenario {
  id: string;
  name: string;
  tagline: string;
  badge: 'CRITICAL' | 'WARNING' | 'SAFE';
  description: string;
  rawDiff: string;
  preEvaluated?: Record<string, FileRiskAnalysis>;
}

export const MOCK_SCENARIOS: Record<string, MockScenario> = {
  scenario_a: {
    id: 'scenario_a',
    name: 'Scenario A: Broken Prisma Migration',
    tagline: 'Database Schema Shift → Runtime Crash',
    badge: 'CRITICAL',
    description:
      'schema.prisma drops organizationId column. userController.ts attempts to read user.organizationId causing an unhandled 500 TypeError at runtime.',
    rawDiff: `diff --git a/prisma/schema.prisma b/prisma/schema.prisma
index 8a34bc1..9f12d4a 100644
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -14,7 +14,6 @@ model User {
   id             String   @id @default(uuid())
   email          String   @unique
   name           String?
-  organizationId String   @map("org_id")
   createdAt      DateTime @default(now())
   updatedAt      DateTime @updatedAt
 }
diff --git a/src/controllers/userController.ts b/src/controllers/userController.ts
index c4e81a9..d2b7811 100644
--- a/src/controllers/userController.ts
+++ b/src/controllers/userController.ts
@@ -1,5 +1,6 @@
 import { Request, Response } from 'express';
 import prisma from '../lib/prisma';
+import { logAuditEvent } from '../services/audit';
 
 export async function getUserProfile(req: Request, res: Response) {
   const userId = req.params.id;
@@ -12,4 +13,6 @@ export async function getUserProfile(req: Request, res: Response) {
-  const org = await prisma.organization.findUnique({ where: { id: user.organizationId } });
+  const org = await prisma.organization.findUnique({ where: { id: (user as any).organizationId } });
+  await logAuditEvent('PROFILE_ACCESSED', { userId, orgId: (user as any).organizationId });
   return res.json({ user, org });
 }
diff --git a/src/routes/auth.ts b/src/routes/auth.ts
index b73e910..a4891b2 100644
--- a/src/routes/auth.ts
+++ b/src/routes/auth.ts
@@ -2,6 +2,7 @@ import { Router } from 'express';
 import { getUserProfile } from '../controllers/userController';
+import { requireSession } from '../middleware/session';
 
 const router = Router();
+router.get('/me', requireSession, getUserProfile);
 export default router;
`,
    preEvaluated: {
      'prisma/schema.prisma': {
        riskLevel: 'CRITICAL',
        breakReason: 'Deleted organizationId column from User schema; breaking downstream foreign keys.',
        intentSummary: 'Refactoring User model schema by dropping organization multi-tenancy column.',
        isRootCause: true,
      },
      'src/controllers/userController.ts': {
        riskLevel: 'CRITICAL',
        breakReason: 'Attempts to read undefined organizationId at runtime resulting in unhandled TypeError.',
        intentSummary: 'Accessing user identity profile properties in HTTP response handler.',
        isRootCause: false,
      },
      'src/routes/auth.ts': {
        riskLevel: 'WARNING',
        breakReason: 'Session middleware payload signature modified; requires downstream verification.',
        intentSummary: 'Mounting authentication route handlers with session verification middleware.',
        isRootCause: false,
      },
    },
  },

  scenario_b: {
    id: 'scenario_b',
    name: 'Scenario B: Auth Session Refactor',
    tagline: 'Cookie Auth → Redis Session Tokens',
    badge: 'WARNING',
    description:
      'JWT moved to centralized Redis sessions. Downstream routes require updated authorization header handling.',
    rawDiff: `diff --git a/src/middleware/jwt.ts b/src/middleware/jwt.ts
index 72ef910..819ab23 100644
--- a/src/middleware/jwt.ts
+++ b/src/middleware/jwt.ts
@@ -8,6 +8,8 @@ export function verifyToken(req: Request, res: Response, next: NextFunction) {
-  const token = req.cookies['session_token'];
+  const authHeader = req.headers.authorization;
+  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
   if (!token) return res.status(401).json({ error: 'Unauthorized' });
   return next();
 }
diff --git a/src/routes/api.ts b/src/routes/api.ts
index c12a884..f512c90 100644
--- a/src/routes/api.ts
+++ b/src/routes/api.ts
@@ -1,5 +1,6 @@
 import { Router } from 'express';
 import { verifyToken } from '../middleware/jwt';
+import { rateLimiter } from '../middleware/limiter';
 
 const router = Router();
-router.use(verifyToken);
+router.use(rateLimiter, verifyToken);
 export default router;
`,
    preEvaluated: {
      'src/middleware/jwt.ts': {
        riskLevel: 'WARNING',
        breakReason: 'Switched auth token parsing from cookies to Bearer header; legacy web clients will receive 401.',
        intentSummary: 'Standardizing token extraction from Authorization header instead of cookie jar.',
        isRootCause: true,
      },
      'src/routes/api.ts': {
        riskLevel: 'WARNING',
        breakReason: 'Injected rate limiter middleware ahead of JWT authentication pipeline.',
        intentSummary: 'Protecting downstream API endpoints with rate-limiting guardrails.',
        isRootCause: false,
      },
    },
  },

  scenario_c: {
    id: 'scenario_c',
    name: 'Scenario C: Safe Utility Add',
    tagline: 'Isolated Pure Helper Function',
    badge: 'SAFE',
    description: 'Added localized currency formatter utility function with zero downstream breaking side-effects.',
    rawDiff: `diff --git a/src/utils/formatters.ts b/src/utils/formatters.ts
index e11299c..f381012 100644
--- a/src/utils/formatters.ts
+++ b/src/utils/formatters.ts
@@ -10,3 +10,10 @@ export function formatDate(date: Date): string {
   return date.toISOString().split('T')[0];
 }
+
+export function formatCurrency(amountCents: number, currency = 'USD'): string {
+  return new Intl.NumberFormat('en-US', {
+    style: 'currency',
+    currency,
+  }).format(amountCents / 100);
+}
`,
    preEvaluated: {
      'src/utils/formatters.ts': {
        riskLevel: 'SAFE',
        breakReason: 'All additions are isolated pure helper functions with zero breaking side-effects.',
        intentSummary: 'Added localized currency formatting utility with configurable ISO code support.',
        isRootCause: false,
      },
    },
  },
};

export const DEFAULT_MOCK_DIFF = MOCK_SCENARIOS.scenario_a.rawDiff;
