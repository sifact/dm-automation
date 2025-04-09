import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Node, Edge, OnNodesChange, OnEdgesChange, applyNodeChanges, applyEdgeChanges, Connection, addEdge, NodeChange, EdgeChange } from "reactflow";
import { toast } from "sonner";
import { loadFlowAction, saveFlowAction } from "@/actions/flows";

const FLOW_QUERY_KEY = "flow-data";

export const useFlowBuilder = (flowId: string) => {
  const queryClient = useQueryClient();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // --- Data Fetching (Loading) ---
  const { data: initialFlowData, isLoading: isLoadingFlow } = useQuery({
    queryKey: [FLOW_QUERY_KEY, flowId],
    queryFn: async () => {
      const result = await loadFlowAction(flowId);
      if (result.status !== 200 || !result.data) {
        toast.error(result.message || "Failed to load flow data.");
        return { nodes: [], edges: [] };
      }
      return result.data;
    },
    enabled: !!flowId,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  // --- Set initial state once data is loaded ---
  useEffect(() => {
    if (initialFlowData) {
      setNodes(initialFlowData.nodes || []);
      setEdges(initialFlowData.edges || []);
    }
  }, [initialFlowData]);

  // --- React Flow State Handlers ---
  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect = useCallback((connection: Connection) => setEdges((eds) => addEdge(connection, eds)), []);

  // --- Data Saving ---
  const { mutate: saveFlow, isPending: isSavingFlow } = useMutation({
    mutationFn: async () => {
      if (!flowId) throw new Error("Flow ID is missing.");
      return saveFlowAction(flowId, nodes, edges);
    },
    onSuccess: (result) => {
      if (result.status === 200) {
        toast.success(result.message || "Flow saved successfully!");
        queryClient.invalidateQueries({ queryKey: [FLOW_QUERY_KEY, flowId] });
      } else {
        toast.error(result.message || "Failed to save flow.");
      }
    },
    onError: (error: any) => {
      toast.error(`An error occurred: ${error.message}`);
    },
  });

  return {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    saveFlow,
    isSavingFlow,
    isLoadingFlow,
  };
};
