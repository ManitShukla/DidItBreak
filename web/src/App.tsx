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
import { FileCode2, RefreshCw, AlertCircle, Terminal } from 'lucide-react';

import CodeDiffNode, { CodeDiffNodeData, CodeDiffNodeType } from './components/CodeDiffNode';
import GlobalVerdict from './components/GlobalVerdict';
import PresetsBar from './components/PresetsBar';
import DetailDrawer from './components/DetailDrawer';
import CodeChatDrawer from './components/CodeChatDrawer';
import { parseGitDiff } from './services/diffParser';
import { buildGraphFromDiffs } from './services/graphBuilder';
import { useDiffSocket } from './services/socket';
import { analyzeFileDiff, FileRiskAnalysis } from './services/gemini';
import { askCodeAssistant, ChatMessage, PinnedContext } from './services/chatService';
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

  // Chatbot State
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [pinnedCode, setPinnedCode] = useState<PinnedContext | null>(null);

  // Connect to live watcher via WebSocket with dynamic folder switching support
  const {
    isConnected,
    isConnecting,
    rawDiff,
    activePath,
    repoName,
    directoryError,
    isChangingDirectory,
    changeDirectory,
    reconnect,
  } = useDiffSocket();

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

  // Handler for pinning code snippet and opening AI Chat drawer
  const handlePinSnippet = useCallback((fileName: string, snippet: string, lineRange?: string) => {
    setPinnedCode({ fileName, codeSnippet: snippet, lineRange });
    setIsChatOpen(true);
  }, []);

  // When active diff text or scenario changes, compute analysis and build graph
  useEffect(() => {
    const parsedFiles = parseGitDiff(activeDiffText);

    // If active scenario has pre-evaluated analysis, use it immediately
    const currentScenario = selectedScenarioKey ? MOCK_SCENARIOS[selectedScenarioKey] : null;
    if (currentScenario?.preEvaluated) {
      const { nodes: newNodes, edges: newEdges } = buildGraphFromDiffs(
        parsedFiles,
        currentScenario.preEvaluated,
        handlePinSnippet
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
    const { nodes: initialNodes, edges: initialEdges } = buildGraphFromDiffs(
      parsedFiles,
      undefined,
      handlePinSnippet
    );
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
        initialAnalyses,
        handlePinSnippet
      );
      setNodes(updatedNodes);
      setEdges(updatedEdges);
    });

    return () => {
      isCancelled = true;
    };
  }, [activeDiffText, selectedScenarioKey, setNodes, setEdges, handlePinSnippet]);

  // Chat message submission
  const handleSendChatMessage = useCallback(
    async (text: string) => {
      const userMessageId = `msg-${Date.now()}`;
      const newUserMsg: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: text,
        timestamp: Date.now(),
        pinnedContext: pinnedCode || undefined,
      };

      setChatHistory((prev) => [...prev, newUserMsg]);
      setIsChatLoading(true);

      try {
        const assistantReply = await askCodeAssistant(
          text,
          chatHistory,
          pinnedCode || undefined,
          activeDiffText
        );

        const newAssistantMsg: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          role: 'assistant',
          content: assistantReply,
          timestamp: Date.now(),
        };

        setChatHistory((prev) => [...prev, newAssistantMsg]);
      } catch (err) {
        const errorReply: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Failed to query AI model: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
          timestamp: Date.now(),
        };
        setChatHistory((prev) => [...prev, errorReply]);
      } finally {
        setIsChatLoading(false);
      }
    },
    [pinnedCode, chatHistory, activeDiffText]
  );

  // Handle Scenario switching
  const handleSelectScenario = (key: string) => {
    setSelectedScenarioKey(key);
    setActiveDiffText(MOCK_SCENARIOS[key].rawDiff);
    setPinnedCode(null);
  };

  const handleSelectLive = () => {
    setSelectedScenarioKey(null);
    if (isConnected && rawDiff) {
      setActiveDiffText(rawDiff);
    } else {
      setActiveDiffText(DEFAULT_MOCK_DIFF);
    }
  };

  // Handle Dynamic Directory Switching
  const handleDirectoryChange = useCallback(
    (newPath: string) => {
      setSelectedScenarioKey(null);
      changeDirectory(newPath);
      setPinnedCode(null);
    },
    [changeDirectory]
  );

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

  // Highlight connected edges with institutional blue or red animated stroke
  const displayEdges = useMemo(() => {
    if (!selectedNodeId) return edges;

    const isTargetCritical = selectedNode?.data.riskLevel === 'CRITICAL';
    const activeColor = isTargetCritical ? '#D82C2C' : '#0033A0';

    return edges.map((e) => {
      const isConnectedEdge = e.source === selectedNodeId || e.target === selectedNodeId;
      return {
        ...e,
        animated: isConnectedEdge,
        style: isConnectedEdge
          ? {
              stroke: activeColor,
              strokeWidth: 2.5,
              filter: `drop-shadow(0 0 6px ${isTargetCritical ? 'rgba(216, 44, 44, 0.8)' : 'rgba(0, 51, 160, 0.8)'})`,
            }
          : {
              stroke: '#3B3B3B',
              strokeWidth: 1,
              opacity: 0.2,
            },
      };
    });
  }, [edges, selectedNodeId, selectedNode]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#05070A] text-[#FFFFFF] select-none overflow-hidden font-sans">
      {/* 1. Global Verdict Sticky Banner with Active Repository Switcher */}
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
        activePath={activePath}
        repoName={repoName}
        isChangingDirectory={isChangingDirectory}
        directoryError={directoryError}
        onSelectDirectory={handleDirectoryChange}
      />

      {/* 2. Demo Presets & Controls Category Bar */}
      <PresetsBar
        selectedScenarioKey={selectedScenarioKey}
        isWatcherConnected={isConnected}
        onSelectLive={handleSelectLive}
        onSelectScenario={handleSelectScenario}
      />

      {/* 3. Main Graph Workspace */}
      <main className="relative flex-1 w-full h-full overflow-hidden bg-[#05070A]">
        {/* Loading Overlay when rebinding repository */}
        {isChangingDirectory && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05070A]/90 z-30 space-y-3 font-mono">
            <div className="p-3 bg-[#1A1A1A] border border-[#3B3B3B] text-[#D82C2C]">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#FFFFFF]">
              REBINDING WATCHER // SWITCHING ACTIVE TARGET...
            </h3>
            <p className="text-[11px] text-[#697271] max-w-md text-center bg-[#1A1A1A] px-3 py-1 border border-[#3B3B3B]">
              TARGET // {activePath || 'VALIDATING REPOSITORY...'}
            </p>
          </div>
        )}

        {nodes.length === 0 && !isChangingDirectory ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 z-10 font-mono">
            <div className="p-4 bg-[#1A1A1A] border border-[#3B3B3B] text-[#697271]">
              <FileCode2 className="w-8 h-8" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-[#FFFFFF]">
              NO ACTIVE GIT DIFF CHANGES DETECTED
            </h3>
            <p className="text-[11px] text-[#697271] max-w-md leading-relaxed">
              {activePath
                ? `Currently watching repository: ${activePath}. Save any file in this repository to stream diffs, or choose a preset scenario above.`
                : 'Save changes in your repository to stream diffs via WebSocket, or select one of the demonstration scenarios above.'}
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
          className="bg-[#05070A]"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#3B3B3B" />
          <Controls />
          <MiniMap
            nodeColor={(n: Node) => {
              const data = n.data as unknown as CodeDiffNodeData;
              if (data?.riskLevel === 'CRITICAL') return '#D82C2C';
              if (data?.riskLevel === 'WARNING') return '#f59e0b';
              return '#0033A0';
            }}
            className="!bg-[#1A1A1A] !border-[#3B3B3B] !rounded-none"
          />
        </ReactFlow>

        {/* 4. Slide-over Detail Inspection Panel with Selectable Diff Lines */}
        {selectedNode && (
          <DetailDrawer
            nodeData={selectedNode.data}
            downstreamFiles={downstreamFiles}
            upstreamFiles={upstreamFiles}
            onClose={() => setSelectedNodeId(null)}
            onSelectCode={handlePinSnippet}
            pinnedSnippet={pinnedCode?.codeSnippet}
          />
        )}

        {/* 5. Directory Error Toast Notification */}
        {directoryError && (
          <div className="absolute bottom-6 right-6 z-40 p-4 bg-[#1A1A1A] border-2 border-[#D82C2C] text-[#FFFFFF] flex items-start space-x-3 max-w-md animate-in slide-in-from-bottom-2 font-mono">
            <AlertCircle className="w-5 h-5 text-[#D82C2C] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#D82C2C] uppercase tracking-wider">
                DIRECTORY SWITCH REJECTED
              </h4>
              <p className="text-xs text-[#C8CECD] mt-0.5 leading-relaxed">
                {directoryError}
              </p>
            </div>
          </div>
        )}

        {/* 6. Floating Chatbot Launcher Button (Sharp rectangular Swiss CTA) */}
        {!isChatOpen && (
          <button
            type="button"
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 px-4 py-2.5 bg-[#D82C2C] hover:bg-[#D82C2C]/90 text-[#FFFFFF] font-mono font-bold uppercase tracking-[0.1em] text-xs border border-[#D82C2C] transition-colors cursor-pointer group"
            title="Open DidItBreak AI Chat Explainer"
          >
            <div className="relative flex items-center justify-center">
              <Terminal className="w-4 h-4 text-[#FFFFFF]" />
              <span className="w-1.5 h-1.5 bg-[#FFFFFF] absolute -top-1 -right-1 animate-ping" />
            </div>
            <span>[ASK AI AGENT]</span>
            {pinnedCode && (
              <span className="px-1.5 py-0.2 bg-[#05070A] text-[9px] font-mono text-[#FFFFFF] border border-[#3B3B3B]">
                1 PINNED
              </span>
            )}
          </button>
        )}

        {/* 7. Code Explainer Chat Drawer */}
        <CodeChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          history={chatHistory}
          onSendMessage={handleSendChatMessage}
          isLoading={isChatLoading}
          pinnedContext={pinnedCode}
          onClearPinned={() => setPinnedCode(null)}
          activeFileName={selectedNode?.data.fileName || pinnedCode?.fileName}
          onClearHistory={() => setChatHistory([])}
        />
      </main>
    </div>
  );
};

export default App;
