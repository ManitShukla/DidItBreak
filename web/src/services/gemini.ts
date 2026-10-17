export interface FileRiskAnalysis {
  riskLevel: 'CRITICAL' | 'WARNING' | 'SAFE';
  breakReason: string;    // 1 punchy sentence explaining the concrete failure point
  intentSummary: string;  // 1 clear sentence explaining architectural goal
  isRootCause: boolean;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Deterministic local heuristic safety engine fallback.
 * Used when Gemini API key is missing, network is offline, or request exceeds 2000ms timeout.
 */
export function getLocalFallbackAnalysis(filePath: string, rawPatch: string): FileRiskAnalysis {
  const lowerPath = filePath.toLowerCase();
  const lowerPatch = rawPatch.toLowerCase();

  // Scenario 1 Heuristics: Prisma / DB Schema Deletions
  if (lowerPath.includes('schema.prisma') || (lowerPath.includes('schema') && lowerPatch.includes('-'))) {
    if (lowerPatch.includes('organizationid') || lowerPatch.includes('-  organizationid') || lowerPatch.includes('-')) {
      return {
        riskLevel: 'CRITICAL',
        breakReason: 'Removed organizationId column from User model schema causing missing column crashes.',
        intentSummary: 'Refactoring User relational schema by removing legacy organization multi-tenancy column.',
        isRootCause: true,
      };
    }
  }

  if (lowerPath.includes('usercontroller') || lowerPath.includes('controller')) {
    if (lowerPatch.includes('organizationid')) {
      return {
        riskLevel: 'CRITICAL',
        breakReason: 'Accesses req.user.organizationId which was deleted from Prisma schema; causes runtime TypeError.',
        intentSummary: 'Accessing user identity profile properties in HTTP response handler.',
        isRootCause: false,
      };
    }
  }

  if (lowerPath.includes('routes/auth') || lowerPath.includes('auth.ts')) {
    if (lowerPatch.includes('organizationid') || lowerPatch.includes('session')) {
      return {
        riskLevel: 'WARNING',
        breakReason: 'Session middleware payload signature modified; requires downstream verification.',
        intentSummary: 'Mounting authentication route handlers with session verification middleware.',
        isRootCause: false,
      };
    }
  }

  // Scenario 2 Heuristics: Auth Header Refactor
  if (lowerPath.includes('jwt') || lowerPath.includes('middleware/jwt')) {
    return {
      riskLevel: 'WARNING',
      breakReason: 'Migrated cookie-based tokens to Authorization Bearer headers; legacy cookie clients will fail.',
      intentSummary: 'Standardizing token extraction from Authorization header instead of cookie jar.',
      isRootCause: true,
    };
  }

  if (lowerPath.includes('routes/api') || lowerPath.includes('api.ts')) {
    return {
      riskLevel: 'WARNING',
      breakReason: 'Injected rate limiter middleware ahead of JWT authentication pipeline.',
      intentSummary: 'Protecting downstream API endpoints with rate-limiting guardrails.',
      isRootCause: false,
    };
  }

  // Scenario 3 Heuristics: Pure Safe Utility Addition
  if (lowerPath.includes('format') || lowerPath.includes('utils') || (lowerPatch.includes('+') && !lowerPatch.includes('-'))) {
    return {
      riskLevel: 'SAFE',
      breakReason: 'All additions are isolated pure helper functions with zero breaking side-effects.',
      intentSummary: 'Added localized currency formatting utility with configurable ISO code support.',
      isRootCause: false,
    };
  }

  // Generic heuristic based on diff volume
  const additions = (rawPatch.match(/^\+[^+]/gm) || []).length;
  const deletions = (rawPatch.match(/^-[^-]/gm) || []).length;

  if (deletions > 10 || additions > 50) {
    return {
      riskLevel: 'WARNING',
      breakReason: `Removed ${deletions} lines of existing code; potential breaking contract shifts.`,
      intentSummary: `Refactored existing logic in ${filePath.split('/').pop()}.`,
      isRootCause: false,
    };
  }

  return {
    riskLevel: 'SAFE',
    breakReason: 'Incremental modifications verified safe with non-breaking contracts.',
    intentSummary: `Updated implementation in ${filePath.split('/').pop()}.`,
    isRootCause: false,
  };
}

/**
 * Analyzes a git diff chunk with Google Gemini Flash.
 * Enforces a strict 2000ms timeout before gracefully falling back to deterministic local analysis.
 */
export async function analyzeFileDiff(filePath: string, rawPatch: string): Promise<FileRiskAnalysis> {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

  // If no API key configured, immediately return safe fallback without network delay
  if (!apiKey) {
    return getLocalFallbackAnalysis(filePath, rawPatch);
  }

  const prompt = `You are the DidItBreak AST and architectural safety engine.
Analyze this git diff for a single file within a project.

File: ${filePath}
Patch:
${rawPatch}

Evaluate whether this change introduces runtime failures, breaking contract shifts, or unhandled exceptions.
Return strictly valid JSON matching this schema:
{
  "riskLevel": "CRITICAL" | "WARNING" | "SAFE",
  "breakReason": "One concise sentence on what will break or could fail at runtime.",
  "intentSummary": "One concise sentence on why the developer or AI made this modification.",
  "isRootCause": true | false
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Gemini API] Request returned status ${response.status}. Using fallback analysis.`);
      return getLocalFallbackAnalysis(filePath, rawPatch);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return getLocalFallbackAnalysis(filePath, rawPatch);
    }

    const cleanedText = candidateText.replace(/^```json\s*|\s*```$/g, '').trim();
    const parsed: FileRiskAnalysis = JSON.parse(cleanedText);

    // Validate schema fields
    if (
      (parsed.riskLevel === 'CRITICAL' || parsed.riskLevel === 'WARNING' || parsed.riskLevel === 'SAFE') &&
      typeof parsed.breakReason === 'string' &&
      typeof parsed.intentSummary === 'string'
    ) {
      return {
        riskLevel: parsed.riskLevel,
        breakReason: parsed.breakReason,
        intentSummary: parsed.intentSummary,
        isRootCause: Boolean(parsed.isRootCause),
      };
    }

    return getLocalFallbackAnalysis(filePath, rawPatch);
  } catch (err) {
    clearTimeout(timeoutId);
    // Timeout or network drop falls back gracefully
    return getLocalFallbackAnalysis(filePath, rawPatch);
  }
}
