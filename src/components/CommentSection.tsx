import Link from "next/link";
import { deleteComment } from "@/app/actions/community";
import { getCurrentUser } from "@/lib/auth";
import { listComments } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Comment } from "@/lib/types";
import { Avatar } from "./Avatar";
import { CommentForm } from "./CommentForm";

export async function CommentSection({ postId, slug }: { postId: string; slug: string }) {
  const [comments, user] = await Promise.all([listComments(postId), getCurrentUser()]);
  const visible = comments.filter((c) => !c.hidden);
  const roots = visible.filter((c) => !c.parent_id);
  const repliesTo = (id: string) => visible.filter((c) => c.parent_id === id);
  const canDelete = (c: Comment) => !!user && (user.id === c.user_id || !!user.profile?.is_admin);

  return (
    <section className="mt-16 border-t border-line pt-10" id="comments">
      <h2 className="text-2xl font-bold">Comments ({visible.length})</h2>

      <div className="mt-6">
        {user ? (
          <CommentForm postId={postId} slug={slug} />
        ) : (
          <div className="rounded-xl bg-brand-50 p-5 text-sm">
            <Link href={`/login?next=${encodeURIComponent(`/blog/${slug}#comments`)}`} className="font-medium text-brand-700 hover:underline">
              Sign in
            </Link>{" "}
            to leave a comment.
          </div>
        )}
      </div>

      <ul className="mt-10 space-y-8">
        {roots.map((c) => (
          <li key={c.id}>
            <CommentItem comment={c} slug={slug} canDelete={canDelete(c)} />
            <div className="mt-4 ml-12 space-y-4 border-l-2 border-brand-100 pl-4">
              {repliesTo(c.id).map((r) => (
                <CommentItem key={r.id} comment={r} slug={slug} canDelete={canDelete(r)} />
              ))}
              {user && (
                <details>
                  <summary className="cursor-pointer text-sm font-medium text-brand-700">Reply</summary>
                  <div className="mt-3">
                    <CommentForm postId={postId} slug={slug} parentId={c.id} placeholder={`Reply to ${c.author?.display_name ?? "comment"}…`} />
                  </div>
                </details>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CommentItem({ comment, slug, canDelete }: { comment: Comment; slug: string; canDelete: boolean }) {
  return (
    <div className="flex gap-3">
      <Avatar author={comment.author} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-ink">{comment.author?.display_name ?? "Someone"}</span>
          <span className="text-muted">· {formatDate(comment.created_at)}</span>
          {canDelete && (
            <form action={deleteComment} className="ml-auto">
              <input type="hidden" name="id" value={comment.id} />
              <input type="hidden" name="slug" value={slug} />
              <button className="text-xs text-muted hover:text-red-600">Delete</button>
            </form>
          )}
        </div>
        <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{comment.body}</p>
      </div>
    </div>
  );
}
