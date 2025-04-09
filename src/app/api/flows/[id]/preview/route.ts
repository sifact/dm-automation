import { generateFlowPreview } from "@/actions/flows/preview";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type PreviewResponse = Array<{
  id: string;
  title: string;
  buttons: Array<{
    text: string;
    payload: string;
  }>;
}>;

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Empty conversation template
    const demoPreview: PreviewResponse = [
      {
        id: "welcome-node",
        title: "Hello how can I help you?",
        buttons: [
          { text: "Price", payload: "price-info" },
          { text: "Warranty", payload: "warranty-info" },
          { text: "Video", payload: "video-demo" },
        ],
      },
    ];
    return NextResponse.json(demoPreview);
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate preview" }, { status: 500 });
  }
}
