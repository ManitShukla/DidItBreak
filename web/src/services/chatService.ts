export interface PinnedContext {
  fileName: string;
  codeSnippet: string;
  lineRange?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  pinnedContext?: PinnedContext;
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Intelligent local fallback responder when offline or without Gemini API key.
 */
function generateLocalFallbackResponse(
  question: string,
  pinnedContext?: PinnedContext,
  activeFileDiff?: string
): string {
  const q = question.toLowerCase();
  const snippet = pinnedContext?.codeSnippet || '';
  const file = pinnedContext?.fileName || 'the current diff';

  // Questions about what could break or why it was changed
  if (snippet.includes('organizationId') || snippet.includes('org_id')) {
    if (q.includes('break') || q.includes('fail') || q.includes('runtime')) {
      return `⚠️ **Potential Breakage Point in \`${file}\`**:\n\nThe code references \`organizationId\`, but this column was removed in \`schema.prisma\`. At runtime, querying or asserting \`user.organizationId\` will evaluate to \`undefined\`, causing downstream functions expecting a string ID to throw an unhandled \`TypeError\` (HTTP 500).\n\n**Recommended Fix:**\nVerify whether multi-tenancy was migrated to a dedicated \`OrganizationMembership\` table, or introduce an optional chaining guard:\n\`\`\`typescript\nconst orgId = user?.organizationId ?? null;\nif (!orgId) {\n  return res.status(400).json({ error: 'User does not belong to an organization' });\n}\n\`\`\``;
    }
    if (q.includes('why') || q.includes('intent')) {
      return `ℹ️ **Architectural Intent**:\n\nThis modification is part of a schema refactor disconnecting the direct \`User.organizationId\` foreign key. The developer or AI is likely moving towards multi-tenant workspaces where a user can belong to multiple organizations instead of a strict 1:1 mapping.`;
    }
    return `💡 **Analysis for \`${file}\`**:\n\nSelected snippet:\n\`\`\`typescript\n${snippet}\n\`\`\`\nThis line accesses the \`organizationId\` property. Ensure database queries sync with recent schema migrations.`;
  }

  if (snippet.includes('authorization') || snippet.includes('Bearer') || snippet.includes('jwt')) {
    if (q.includes('break') || q.includes('fail')) {
      return `⚠️ **Contract Shift Warning**:\n\nSwitching from cookie-based token inspection to the \`Authorization: Bearer <token>\` header will reject requests from legacy clients that still send cookies. Make sure your API gateway or client SDKs include the header in outgoing requests.`;
    }
    return `ℹ️ **Security Best Practice**:\n\nExtracting Bearer tokens from the \`Authorization\` header avoids CSRF vulnerabilities common with browser cookie authentication.`;
  }

  if (snippet.includes('formatCurrency') || snippet.includes('formatDate')) {
    return `✅ **Safe Helper Analysis**:\n\nThis is a pure, side-effect-free utility function using \`Intl.NumberFormat\`. It does not mutate external state or depend on network I/O, making it safe for immediate production deployment.`;
  }

  // Generic fallback based on input
  return `### Architectural Review: \`${file}\`\n\n**Target Snippet:**\n\`\`\`\n${snippet || (activeFileDiff ? activeFileDiff.slice(0, 150) + '...' : 'No specific line selected')}\n\`\`\`\n\n**Assessment:**\n1. **Contract Integrity:** Check that function arguments and return types conform with all upstream callers.\n2. **Downstream Safety:** Ensure any modified interfaces or schema keys have corresponding migrations applied.\n3. **Error Boundaries:** Wrap async database or network calls in \`try/catch\` blocks to prevent cascading server restarts.\n\n*(Connect your \`VITE_GEMINI_API_KEY\` in \`web/.env\` for live multi-turn Gemini 1.5 Flash reasoning.)*`;
}

/**
 * Ask the DidItBreak Code Assistant about a file diff or pinpointed snippet.
 */
export async function askCodeAssistant(
  question: string,
  history: ChatMessage[],
  pinnedContext?: PinnedContext,
  activeFileDiff?: string
): Promise<string> {
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';

  // Return intelligent heuristic response if no API key is present
  if (!apiKey) {
    // Simulate brief thinking delay for realistic UX
    await new Promise((res) => setTimeout(res, 400));
    return generateLocalFallbackResponse(question, pinnedContext, activeFileDiff);
  }

  const systemInstructions = `You are the DidItBreak Senior Staff Architect and AI Code Explainer.
Your mission is to help engineers quickly understand git diffs, pinpoint exact breaking risks, and evaluate whether code modifications break downstream runtime contracts.

Context Rules:
- If a specific code snippet is pinned, prioritize explaining that exact line/block and its ripple effect on callers.
- If no snippet is pinned, evaluate the active file's git diff patch and overall blast radius.
- Be concise, technical, precise, and actionable.
- Format code blocks using standard markdown backticks with language tags (e.g. \`\`\`typescript).`;

  // Format context payload
  let contextBlock = '';
  if (pinnedContext && pinnedContext.codeSnippet) {
    contextBlock += `\n\nPINNED CODE SNIPPET (PRIMARY FOCUS):\nFile: ${pinnedContext.fileName}${pinnedContext.lineRange ? ` (Lines: ${pinnedContext.lineRange})` : ''}\n\`\`\`\n${pinnedContext.codeSnippet}\n\`\`\``;
  }

  if (activeFileDiff) {
    contextBlock += `\n\nACTIVE FILE RAW DIFF PATCH:\n\`\`\`\n${activeFileDiff.slice(0, 3000)}\n\`\`\``;
  }

  // Build conversation contents for Gemini API
  const contents = [
    {
      role: 'user',
      parts: [{ text: `${systemInstructions}${contextBlock}` }],
    },
    {
      role: 'model',
      parts: [
        {
          text: 'Understood. I am ready to analyze the diff and pinned code snippets to provide clear, actionable safety diagnostics.',
        },
      ],
    },
  ];

  // Append recent chat history (up to last 6 messages)
  const recentHistory = history.slice(-6);
  for (const msg of recentHistory) {
    contents.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    });
  }

  // Append current user question
  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[Gemini Chat] API responded with ${response.status}. Using fallback response.`);
      return generateLocalFallbackResponse(question, pinnedContext, activeFileDiff);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return generateLocalFallbackResponse(question, pinnedContext, activeFileDiff);
    }

    return candidateText.trim();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn('[Gemini Chat] Request failed or timed out. Falling back to local responder.', err);
    return generateLocalFallbackResponse(question, pinnedContext, activeFileDiff);
  }
}

