import { NextResponse } from "next/server";
import { handleError, requireMediaUser } from "@/lib/media/api";
import { listNotifications, markNotificationsRead, unreadNotificationCount } from "@/lib/media/messaging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The signed-in member's notifications (likes, comments, follows, messages).
 * The service functions already existed; nothing exposed them, so the
 * notifications panel only ever showed an empty mock list.
 */
export async function GET() {
  try {
    const user = await requireMediaUser();
    const [notifications, unread] = await Promise.all([listNotifications(user.id, 50), unreadNotificationCount(user.id)]);
    return NextResponse.json({ notifications, unread }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleError(error);
  }
}

/** Mark notifications as read: { ids?: string[] } (all when omitted). */
export async function POST(req: Request) {
  try {
    const user = await requireMediaUser();
    const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === "string") : undefined;
    await markNotificationsRead(user.id, ids);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}
