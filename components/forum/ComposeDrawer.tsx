"use client";

import { Drawer } from "vaul";
import ComposePost from "./ComposePost";

type PostLabel = 'transfer' | 'taktik' | 'match' | 'rykte' | 'diskussion';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parentId?: string;
  rootId?: string;
  teamSlug: string;
  sport: string;
  replyTo?: string;
  onPost: (data: {
    content: string;
    label?: PostLabel;
    parentId?: string;
    rootId?: string;
    teamSlug: string;
    sport: string;
  }) => Promise<void>;
}

export default function ComposeDrawer({
  open,
  onOpenChange,
  parentId,
  rootId,
  teamSlug,
  sport,
  replyTo,
  onPost,
}: Props) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]" />
        <Drawer.Content className="fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl border-t border-border bg-popover outline-none pb-[max(env(safe-area-inset-bottom),1.5rem)]">
          <div aria-hidden className="mx-auto mt-3 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" />
          <Drawer.Title className="sr-only">
            {replyTo ? `Svara ${replyTo}` : "Nytt inlägg"}
          </Drawer.Title>
          {replyTo && (
            <p className="px-4 pt-2 pb-1 text-xs text-muted-foreground">
              Svarar{" "}
              <span className="text-pitch font-semibold">
                @{replyTo.toLowerCase().replace(/\s+/g, "")}
              </span>
            </p>
          )}
          <div className="px-4 pt-3 pb-2">
            <ComposePost
              parentId={parentId}
              rootId={rootId}
              teamSlug={teamSlug}
              sport={sport}
              onPost={async (data) => {
                await onPost(data);
                onOpenChange(false);
              }}
              placeholder={replyTo ? `Svara ${replyTo}…` : "Vad tänker du?"}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
