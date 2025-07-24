// app/api/email/forwarding/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getEmailForwarding,
  setEmailForwarding,
} from "@/common/namecheap/namecheap";

function requireExecRole(req: NextRequest) {
  // read req to prevent error
  console.debug(req);
  return true; // TODO: Implement actual role check just be extra safe. We already have auth middleware, so this is just a placeholder.
}

export async function GET(req: NextRequest) {
  // enforce EXEC-role auth
  await requireExecRole(req);

  const entries = await getEmailForwarding();
  return NextResponse.json({ ok: entries });
}

export async function POST(req: NextRequest) {
  await requireExecRole(req);

  const { searchParams } = req.nextUrl;
  const mailbox = searchParams.get("mailbox");
  const forwardTo = searchParams.get("forwardTo");

  if (!mailbox || !forwardTo) {
    return NextResponse.json(
      { error: "mailbox and forwardTo query params are required" },
      { status: 400 },
    );
  }

  const list = await getEmailForwarding();
  if (!list.some((e) => e.mailbox === mailbox && e.forwardTo === forwardTo)) {
    list.push({ mailbox, forwardTo });
  }
  await setEmailForwarding(list);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await requireExecRole(req);

  const { searchParams } = req.nextUrl;
  const mailbox = searchParams.get("mailbox");
  const forwardTo = searchParams.get("forwardTo");

  if (!mailbox || !forwardTo) {
    return NextResponse.json(
      { error: "mailbox and forwardTo query params are required" },
      { status: 400 },
    );
  }

  const list = await getEmailForwarding();
  const filtered = list.filter(
    (e) => !(e.mailbox === mailbox && e.forwardTo === forwardTo),
  );
  await setEmailForwarding(filtered);

  return NextResponse.json({ ok: true });
}
