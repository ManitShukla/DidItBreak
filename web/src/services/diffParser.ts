export interface ParsedFileDiff {
  id: string;
  filePath: string;
  fileName: string;
  additions: number;
  deletions: number;
  oldSnippet: string;
  newSnippet: string;
  rawPatch: string;
  imports: string[];
}

/**
 * Extracts import/require path targets from code lines.
 * Handles:
 *   - import ... from './target'
 *   - import './target'
 *   - require('./target')
 *   - export ... from './target'
 */
function extractImportPaths(lines: string[]): string[] {
  const importsSet = new Set<string>();
  const importRegexes = [
    /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
    /import\s+['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+.*?\s+from\s+['"]([^'"]+)['"]/g,
  ];

  for (const line of lines) {
    for (const regex of importRegexes) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(line)) !== null) {
        if (match[1]) {
          importsSet.add(match[1].trim());
        }
      }
    }
  }

  return Array.from(importsSet);
}

/**
 * Parses raw git diff text into structured file-level blocks without external dependencies.
 */
export function parseGitDiff(rawDiff: string): ParsedFileDiff[] {
  if (!rawDiff || typeof rawDiff !== 'string' || rawDiff.trim().length === 0) {
    return [];
  }

  const rawChunks = rawDiff.split(/^diff --git /m);
  const parsedFiles: ParsedFileDiff[] = [];

  for (const chunk of rawChunks) {
    if (!chunk.trim()) continue;

    const fullChunk = 'diff --git ' + chunk;
    const lines = fullChunk.split(/\r?\n/);
    const headerLine = lines[0] || '';

    // Extract file path from header: "diff --git a/path/to/file.ts b/path/to/file.ts"
    const headerMatch = headerLine.match(/^diff --git a\/(.+?)\s+b\/(.+)$/);
    let filePath = '';

    if (headerMatch) {
      // In case of deletion, b/ is /dev/null, so fallback to a/
      filePath = headerMatch[2] === '/dev/null' ? headerMatch[1] : headerMatch[2];
    } else {
      // Secondary fallback detection
      const bFileMatch = fullChunk.match(/^\+\+\+ b\/(.+)$/m);
      const aFileMatch = fullChunk.match(/^--- a\/(.+)$/m);
      if (bFileMatch && bFileMatch[1] !== '/dev/null') {
        filePath = bFileMatch[1];
      } else if (aFileMatch && aFileMatch[1] !== '/dev/null') {
        filePath = aFileMatch[1];
      }
    }

    if (!filePath) {
      continue;
    }

    // Clean up potential null paths or quotes
    filePath = filePath.replace(/^"|"$/g, '').trim();
    const fileName = filePath.split(/[/\\]/).pop() || filePath;

    let additions = 0;
    let deletions = 0;
    const oldLines: string[] = [];
    const newLines: string[] = [];

    // Process diff body lines for hunk changes
    let inHunk = false;
    for (const line of lines) {
      if (line.startsWith('@@')) {
        inHunk = true;
        continue;
      }

      if (!inHunk) continue;

      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++;
        if (newLines.length < 4) {
          newLines.push(line.substring(1));
        }
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++;
        if (oldLines.length < 4) {
          oldLines.push(line.substring(1));
        }
      }
    }

    const imports = extractImportPaths(newLines.length > 0 ? newLines : lines);

    parsedFiles.push({
      id: `node-${filePath.replace(/[^a-zA-Z0-9_-]/g, '_')}`,
      filePath,
      fileName,
      additions,
      deletions,
      oldSnippet: oldLines.join('\n'),
      newSnippet: newLines.join('\n'),
      rawPatch: fullChunk,
      imports,
    });
  }

  return parsedFiles;
}

/**
 * Normalizes relative import paths to help detect matches against file paths.
 */
export function normalizeImport(importPath: string): string {
  return importPath
    .replace(/^(\.\/|\.\.\/)+/, '')
    .replace(/\.(ts|tsx|js|jsx|json|mjs|cjs)$/, '')
    .toLowerCase();
}

