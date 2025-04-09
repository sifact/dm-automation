import { client } from "@/lib/prisma";
import { onCurrentUser } from "@/actions/user";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await onCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { isActive } = body;

    const flow = await client.flow.update({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: {
        isActive,
      },
    });

    return NextResponse.json(flow);
  } catch (error) {
    console.error("Error updating flow:", error);
    return NextResponse.json({ error: "Failed to update flow" }, { status: 500 });
  }
}
