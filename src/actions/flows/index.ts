"use server";

import { client } from "@/lib/prisma";
import { NODE_TYPE } from "@prisma/client";
import { Node, Edge } from "reactflow";

export const saveFlowAction = async (flowId: string, nodes: Node[], edges: Edge[]) => {
  try {
    // First delete existing nodes and edges
    await client.flowNode.deleteMany({
      where: { flowId },
    });

    await client.flowEdge.deleteMany({
      where: { flowId },
    });

    // Create new nodes
    const createdNodes = await Promise.all(
      nodes.map((node) =>
        client.flowNode.create({
          data: {
            id: node.id,
            type: node?.type?.toUpperCase() as NODE_TYPE,
            content: node.data.content?.trim() || "", // remove any trailing whitespace
            positionX: node.position.x,
            positionY: node.position.y,
            data: node.data,
            flowId,
          },
        })
      )
    );

    // Create new edges
    const createdEdges = await Promise.all(
      edges.map((edge) =>
        client.flowEdge.create({
          data: {
            id: edge.id,
            flowId,
            fromNodeId: edge.source,
            toNodeId: edge.target,
            buttonValue: edge.data?.buttonValue,
          },
        })
      )
    );

    return {
      status: 200,
      message: "Flow saved successfully",
      data: { nodes: createdNodes, edges: createdEdges },
    };
  } catch (error: any) {
    console.error("Error saving flow:", error);
    return {
      status: 500,
      message: error.message || "Failed to save flow",
    };
  }
};

export const loadFlowAction = async (flowId: string) => {
  try {
    const flow = await client.flow.findUnique({
      where: { id: flowId },
      include: {
        nodes: true,
        edges: true,
      },
    });

    if (!flow) {
      return {
        status: 404,
        message: "Flow not found",
        data: { nodes: [], edges: [] },
      };
    }

    // Convert Prisma models to ReactFlow format
    const nodes: Node[] = flow.nodes.map((node) => ({
      id: node.id,
      type: node.type.toLowerCase(),
      position: { x: node.positionX, y: node.positionY },
      data: node.data as any,
    }));

    const edges: Edge[] = flow.edges.map((edge) => ({
      id: edge.id,
      source: edge.fromNodeId,
      target: edge.toNodeId,
      data: edge.buttonValue ? { buttonValue: edge.buttonValue } : undefined,
    }));

    return {
      status: 200,
      message: "Flow loaded successfully",
      data: { nodes, edges },
    };
  } catch (error: any) {
    console.error("Error loading flow:", error);
    return {
      status: 500,
      message: error.message || "Failed to load flow",
      data: { nodes: [], edges: [] },
    };
  }
};
