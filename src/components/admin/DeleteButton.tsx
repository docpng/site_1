"use client";

export function DeleteButton({ action, id, what }: { action: (fd: FormData) => Promise<void>; id: string; what: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete this ${what}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn-danger">Delete {what}</button>
    </form>
  );
}
