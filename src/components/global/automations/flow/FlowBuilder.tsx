"use client";
import { useCallback, useState, useEffect } from "react";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, Connection, addEdge, Panel } from "reactflow"; // Removed useNodesState, useEdgesState
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Save, MessageSquare, Bot, User, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { FlowNode, FlowEdge, NodeData } from "@/types/flow";
import { NODE_TYPE } from "@prisma/client";
import { MessageNode } from "./nodes/MessageNode";
import { ButtonNode } from "./nodes/ButtonNode";
import { QuickReplyNode } from "./nodes/QuickReplyNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { InputNode } from "./nodes/InputNode";
import { ApiCallNode } from "./nodes/ApiCallNode";
import { useFlowBuilder } from "@/hooks/useFlowBuilder"; // Import the hook

const nodeTypes = {
  message: MessageNode,
  button: ButtonNode,
  quickReply: QuickReplyNode,
  condition: ConditionNode,
  input: InputNode,
  apiCall: ApiCallNode,
};

type Props = {
  id: string;
  platform: string;
};

export default function FlowBuilder({ id, platform }: Props) {
  // Use the hook for flow state and actions
  const {
    nodes,
    edges,
    setNodes, // Keep setNodes for direct manipulation like adding/deleting
    setEdges, // Keep setEdges for direct manipulation like deleting
    onNodesChange,
    onEdgesChange,
    onConnect,
    saveFlow,
    isSavingFlow,
    isLoadingFlow, // Use loading state
  } = useFlowBuilder(id);

  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodeContent, setNodeContent] = useState("");

  const handleAddNode = (type: NODE_TYPE) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: type.toLowerCase(),
      position: { x: 100, y: 100 },
      data: { content: "" }, // Remove label, only keep content
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id);
    setNodeContent(node.data.content || "");
  };

  // Clear selection when clicking on the pane
  const handlePaneClick = () => {
    setSelectedNode(null);
    setNodeContent("");
  };

  const handleDeleteNode = useCallback(() => {
    if (selectedNode) {
      // Remove the node
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode));
      // Remove all connected edges
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode && edge.target !== selectedNode));
      setSelectedNode(null);
      setNodeContent(""); // Clear inputs
    }
  }, [selectedNode, setNodes, setEdges]);

  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newContent = event.target.value;
    setNodeContent(newContent);
    if (selectedNode) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode) {
            return { ...node, data: { ...node.data, content: newContent } };
          }
          return node;
        })
      );
    }
  };

  // Show loading indicator while fetching initial flow
  if (isLoadingFlow) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]">Loading Flow...</div>;
  }
  return (
    <div className="w-full h-[calc(100vh-200px)]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick} // Add pane click handler
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col gap-2">
            <Button onClick={() => handleAddNode(NODE_TYPE.MESSAGE)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Message
            </Button>
            <Button onClick={() => handleAddNode(NODE_TYPE.BUTTON)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Bot className="w-4 h-4 mr-2" />
              Add Button
            </Button>
            {/* <Button onClick={() => handleAddNode(NODE_TYPE.QUICK_REPLY)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <User className="w-4 h-4 mr-2" />
              Add Quick Reply
            </Button>
            <Button onClick={() => handleAddNode(NODE_TYPE.CONDITION)} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <MessageSquare className="w-4 h-4 mr-2" />
              Add Condition
            </Button> */}
          </div>
        </Panel>
        <Panel position="top-right" className="bg-gray-800 p-4 rounded-lg">
          <Button onClick={() => saveFlow()} disabled={isSavingFlow} className="bg-green-600 hover:bg-green-700">
            {" "}
            {/* Use saveFlow from hook */}
            <Save className="w-4 h-4 mr-2" />
            {isSavingFlow ? "Saving..." : "Save Flow"} {/* Use isSavingFlow from hook */}
          </Button>
        </Panel>
        {selectedNode && (
          <Panel position="bottom-right" className="bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-col gap-2">
              <Input placeholder="Node content" value={nodeContent} onChange={handleContentChange} className="bg-gray-700 border-gray-600" />
              <Button onClick={handleDeleteNode} size="sm" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Node
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
