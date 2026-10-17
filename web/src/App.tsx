import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MiniMap,
} from '@xyflow/react';
import { FileCode2 } from 'lucide-react';

import CodeDiffNode, { CodeDiffNodeData, CodeDiffNodeType } from './components/CodeDiffNode';
import GlobalVerdict from './components/GlobalVerdict';
import PresetsBar from './components/PresetsBar';
import DetailDrawer from './components/DetailDrawer';
import { parseGitDiff } from './services/diffParser';
import { buildGraphFromDiffs } from './services/graphBuilder';
import { useDiffSocket } from './services/socket';
import { analyzeFileDiff, FileRiskAnalysis } from './services/gemini';
import { MOCK_SCENARIOS, DEFAULT_MOCK_DIFF } from './data/mockScenarios';

const nodeTypes = {
  codeDiffNode: CodeDiffNode,
};

export const App: React.FC = () => {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<string | null>('scenario_a');
  const [activeDiffText, setActiveDiffText] = useState<string>(DEFAULT_MOCK_DIFF);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<CodeDiffNodeType>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Connect to live watcher via WebSocket
  const { isConnected, isConnecting, rawDiff, reconnect } = useDiffSocket();

  // If live watcher connects and sends diffs, switch to live mode automatically
  const prevRawDiffRef = useRef<string>('');
  useEffect(() => {
    if (isConnected && rawDiff && rawDiff !== prevRawDiffRef.current) {
      prevRawDiffRef.current = rawDiff;
      if (selectedScenarioKey === null) {
        setActiveDiffText(rawDiff);
      }
    }
  }, [isConnected, rawDiff, selectedScenarioKey]);

  // When active diff text or scenario changes, compute analysis and build graph
  useEffect(() => {
    const parsedFiles = parseGitDiff(activeDiffText);

    // If active scenario has pre-evaluated analysis, use it immediately
    const currentScenario = selectedScenarioKey ? MOCK_SCENARIOS[selectedScenarioKey] : null;
    if (currentScenario?.preEvaluated) {
      const { nodes: newNodes, edges: newEdges } = buildGraphFromDiffs(
        parsedFiles,
        currentScenario.preEvaluated
      );
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedNodeId(null);
      return;
    }

    // Otherwise, perform async Gemini analysis for live diffs
    let isCancelled = false;
    const initialAnalyses: Record<string, FileRiskAnalysis> = {};

    // Initial build with heuristic fallback for instant render
    const { nodes: initialNodes, edges: initialEdges } = buildGraphFromDiffs(parsedFiles);
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId(null);

    // Run async Gemini Flash evaluations in parallel
    Promise.all(
      parsedFiles.map(async (file) => {
        const result = await analyzeFileDiff(file.filePath, file.rawPatch);
        return { path: file.filePath, result };
      })
    ).then((results) => {
      if (isCancelled) return;
      results.forEach(({ path, result }) => {
        initialAnalyses[path] = result;
      });
      const { nodes: updatedNodes, edges: updatedEdges } = buildGraphFromDiffs(
        parsedFiles,
        initialAnalyses
      );
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    });

    return () => {
      isCancelled = true;
    };
  }, [activeDiffText, selectedScenarioKey, setNodes, setEdges]);

  // Handle Scenario switching
  const handleSelectScenario = (key: string) => {
    setSelectedScenarioKey(key);
    setActiveDiffText(MOCK_SCENARIOS[key].rawDiff);
  };

  const handleSelectLive = () => {
    setSelectedScenarioKey(null);
    if (isConnected && rawDiff) {
      setActiveDiffText(rawDiff);
    } else {
      setActiveDiffText(DEFAULT_MOCK_DIFF);
    }
  };

  // Node selection handlers
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Compute selected node data
  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Compute Downstream and Upstream files for blast-radius inspection
  const { downstreamFiles, upstreamFiles } = useMemo(() => {
    if (!selectedNodeId) return { downstreamFiles: [], upstreamFiles: [] };

    const downstream: string[] = [];
    const upstream: string[] = [];

    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) {
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (targetNode) downstream.push(targetNode.data.filePath);
      }
      if (edge.target === selectedNodeId) {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        if (sourceNode) upstream.push(sourceNode.data.filePath);
      }
    });

    return { downstreamFiles: downstream, upstreamFiles: upstream };
  }, [edges, nodes, selectedNodeId]);

  // Compute global metrics and verdict
  const metrics = useMemo(() => {
    let additions = 0;
    let deletions = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let criticalFile = '';

    nodes.forEach((n) => {
      additions += n.data.additions;
      deletions += n.data.deletions;
      if (n.data.riskLevel === 'CRITICAL') {
        criticalCount++;
        if (!criticalFile || n.data.isRootCause) {
          criticalFile = n.data.fileName;
        }
      }
      if (n.data.riskLevel === 'WARNING') warningCount++;
    });

    let verdict: 'CRITICAL' | 'WARNING' | 'SAFE' = 'SAFE';

    if (criticalCount > 0) {
      verdict = 'CRITICAL';
    } else if (warningCount > 0) {
      verdict = 'WARNING';
    }

    return {
      totalFiles: nodes.length,
      additions,
      deletions,
      verdict,
      criticalFile,
      warningCount,
    };
  }, [nodes]);

  // Highlight / Dim nodes based on blast-radius selection
  const displayNodes = useMemo(() => {
    if (!selectedNodeId) return nodes;

    const connectedNodeIds = new Set<string>([selectedNodeId]);
    edges.forEach((edge) => {
      if (edge.source === selectedNodeId) connectedNodeIds.add(edge.target);
      if (edge.target === selectedNodeId) connectedNodeIds.add(edge.source);
    });

    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        isDimmed: !connectedNodeIds.has(n.id),
      },
    }));
  }, [nodes, edges, selectedNodeId]);

  // Highlight connected edges with glowing animated stroke
  const displayEdges = useMemo(() => {
    if (!selectedNodeId) return edges;

    return edges.map((e) => {
      const isConnectedEdge = e.source === selectedNodeId || e.target === selectedNodeId;
      return {
        ...e,
        animated: isConnectedEdge,
        style: isConnectedEdge
          ? {
              stroke: '#f43f5e',
              strokeWidth: 3,
              filter: 'drop-shadow(0 0 10px rgba(244,63,94,0.7))',
            }
          : {
              stroke: '#27272a',
              strokeWidth: 1,
              opacity: 0.2,
            },
      };
    });
  }, [edges, selectedNodeId]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 select-none overflow-hidden font-sans">
      {/* 1. Global Verdict Sticky Banner */}
      <GlobalVerdict
        verdict={metrics.verdict}
        criticalFile={metrics.criticalFile}
        warningCount={metrics.warningCount}
        totalFiles={metrics.totalFiles}
        additions={metrics.additions}
        deletions={metrics.deletions}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onReconnect={reconnect}
      />

      {/* 2. Demo Presets & Controls Toolbar */}
      <PresetsBar
        selectedScenarioKey={selectedScenarioKey}
        isWatcherConnected={isConnected}
        onSelectLive={handleSelectLive}
        onSelectScenario={handleSelectScenario}
      />

      {/* 3. Main Graph Workspace */}
      <main className="relative flex-1 w-full h-full overflow-hidden bg-zinc-950">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-10">
            <FileCode2 className="w-12 h-12 text-zinc-600 animate-pulse" />
            <h3 className="text-lg font-semibold text-zinc-300">No active git diff changes detected</h3>
            <p className="text-sm text-zinc-500 max-w-md">
              Save changes in your repository to stream diffs via WebSocket, or select one of the demonstration scenarios above.
            </p>
          </div>
        ) : null}

        <ReactFlow
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.2}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
          }}
          className="bg-zinc-950"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#27272a" />
          <Controls className="!bg-zinc-900 !border-zinc-800 !text-zinc-300 !fill-zinc-300" />
          <MiniMap
            nodeColor={(n: Node) => {
              const data = n.data as unknown as CodeDiffNodeData;
              if (data?.riskLevel === 'CRITICAL') return '#f43f5e';
              if (data?.riskLevel === 'WARNING') return '#f59e0b';
              return '#10b981';
            }}
            className="!bg-zinc-900/90 !border-zinc-800 !rounded-lg"
          />
        </ReactFlow>

        {/* 4. Slide-over Detail Inspection Panel */}
        {selectedNode && (
          <DetailDrawer
            nodeData={selectedNode.data}
            downstreamFiles={downstreamFiles}
            upstreamFiles={upstreamFiles}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
