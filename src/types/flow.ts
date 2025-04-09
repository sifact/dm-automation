import { NODE_TYPE } from "@prisma/client";

export type NodePosition = {
  x: number;
  y: number;
};

export type NodeData = {
  buttonText?: string;
  quickReplies?: Array<{
    text: string;
    value: string;
  }>;
  condition?: {
    type: string;
    value: string;
  };
};

export type FlowNode = {
  id: string;
  type: NODE_TYPE;
  content: string;
  position: NodePosition;
  data?: NodeData;
  isSelected?: boolean;
  isDragging?: boolean;
};

export type FlowEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  // type: EDGE_TYPE;
  condition?: {
    type: string;
    value: string;
  };
  isSelected?: boolean;
};

export type FlowState = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode?: string;
  selectedEdge?: string;
  isDragging?: boolean;
  dragStart?: NodePosition;
};
