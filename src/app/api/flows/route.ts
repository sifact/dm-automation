import { client } from "@/lib/prisma";
import { INTEGRATIONS } from "@prisma/client";
import { NextResponse } from "next/server";
import { onCurrentUser } from "@/actions/user";

export async function GET(request: Request) {
  try {
    const user = await onCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform") as INTEGRATIONS;

    const userWithFlows = await client.user.findUnique({
      where: { clerkId: user.id },
      select: {
        flows: {
          where: {
            platform: platform || undefined,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(userWithFlows?.flows || []);
  } catch (error) {
    console.error("Error fetching flows:", error);
    return NextResponse.json({ error: "Failed to fetch flows" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await onCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, platform } = body;

    const updatedUser = await client.user.update({
      where: { clerkId: user.id },
      data: {
        flows: {
          create: {
            name: name || "Untitled",
            platform,
          },
        },
      },
      select: {
        flows: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(updatedUser.flows[0]);
  } catch (error) {
    console.error("Error creating flow:", error);
    return NextResponse.json({ error: "Failed to create flow" }, { status: 500 });
  }
}
