import { Edge, MarkerType } from '@xyflow/react';
import { ParsedFileDiff, normalizeImport } from './diffParser';
import { CodeDiffNodeType } from '../components/CodeDiffNode';
import { FileRiskAnalysis, getLocalFallbackAnalysis } from './gemini';

export interface GraphData {
  nodes: CodeDiffNodeType[];
  edges: Edge[];
}

/**
 * Extracts immediate parent directory path from a file path.
 */
function getParentDir(filePath: string): string {
  const parts = filePath.split(/[/\\]/);
  parts.pop();
  return parts.join('/');
}

/**
 * Maps ParsedFileDiff[] to XYFlow Node and Edge arrays following topological heuristics.
 * Optionally integrates Gemini/pre-computed semantic risk analyses.
 */
export function buildGraphFromDiffs(
  fileDiffs: ParsedFileDiff[],
  analyses?: Record<string, FileRiskAnalysis>
): GraphData {
  if (fileDiffs.length === 0) {
    return { nodes: [], edges: [] };
  }

  // 1. Generate Nodes
  const nodes: CodeDiffNodeType[] = fileDiffs.map((diff, index) => {
    // Fetch semantic analysis from Gemini or local deterministic fallback
    const analysis: FileRiskAnalysis =
      (analyses && (analyses[diff.filePath] || analyses[diff.fileName])) ||
      getLocalFallbackAnalysis(diff.filePath, diff.rawPatch);

    // Grid layout: clean horizontal columns with vertical staggering
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = col * 420 + 80;
    const y = row * 340 + 80;

    return {
      id: diff.id,
      type: 'codeDiffNode',
      position: { x, y },
      data: {
        ...diff,
        riskLevel: analysis.riskLevel,
        breakReason: analysis.breakReason,
        intentSummary: analysis.intentSummary,
        isRootCause: analysis.isRootCause,
      },
    };
  });

  // 2. Generate Edges based on imports and directory proximity
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  for (let i = 0; i < fileDiffs.length; i++) {
    const sourceDiff = fileDiffs[i];
    const sourceParent = getParentDir(sourceDiff.filePath);

    for (let j = 0; j < fileDiffs.length; j++) {
      if (i === j) continue;
      const targetDiff = fileDiffs[j];
      const targetBase = targetDiff.fileName.replace(/\.[^/.]+$/, '').toLowerCase();
      const targetNormalized = normalizeImport(targetDiff.filePath);

      // Check if source imports target
      const importsTarget = sourceDiff.imports.some((imp) => {
        const norm = normalizeImport(imp);
        return norm === targetBase || norm.endsWith(targetBase) || targetNormalized.endsWith(norm);
      });

      if (importsTarget) {
        // Edge flows from root provider to dependent consumer
        const edgeId = `edge-${targetDiff.id}->${sourceDiff.id}`;
        if (!edgeSet.has(edgeId)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: targetDiff.id,
            target: sourceDiff.id,
            animated: true,
            style: { stroke: '#38bdf8', strokeWidth: 2.5 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#38bdf8',
            },
          });
        }
      }
    }

    // Secondary check: share immediate parent directory
    for (let j = i + 1; j < fileDiffs.length; j++) {
      const otherDiff = fileDiffs[j];
      const otherParent = getParentDir(otherDiff.filePath);
      if (sourceParent && otherParent && sourceParent === otherParent) {
        const edgeId = `edge-dir-${sourceDiff.id}->${otherDiff.id}`;
        if (!edgeSet.has(edgeId) && !edgeSet.has(`edge-dir-${otherDiff.id}->${sourceDiff.id}`)) {
          edgeSet.add(edgeId);
          edges.push({
            id: edgeId,
            source: sourceDiff.id,
            target: otherDiff.id,
            animated: false,
            style: { stroke: '#52525b', strokeWidth: 1.5, strokeDasharray: '4 4' },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#71717a',
            },
          });
        }
      }
    }
  }

  // 3. Fallback Linkage: sequential causal chain if multiple files and no edges detected
  if (edges.length === 0 && fileDiffs.length > 1) {
    for (let i = 0; i < fileDiffs.length - 1; i++) {
      const source = fileDiffs[i].id;
      const target = fileDiffs[i + 1].id;
      edges.push({
        id: `edge-fallback-${source}->${target}`,
        source,
        target,
        animated: true,
        style: { stroke: '#f43f5e', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#f43f5e',
        },
      });
    }
  }

  return { nodes, edges };
}
