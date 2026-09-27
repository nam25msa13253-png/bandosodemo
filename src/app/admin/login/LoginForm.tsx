"use client";
import { useFormAction } from "@/lib/use-form-action";
import { Loader2, LogIn } from "lucide-react";
import { login } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const { state: err, onSubmit, pending } = useFormAction(login, null);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="username">Tên đăng nhập</label>
        <input id="username" name="username" autoComplete="username" required className="input h-11" />
      </div>
      <div>
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input h-11" />
      </div>
      {err && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{err}</p>}
      <button disabled={pending} className="btn btn-primary h-11 w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Đăng nhập
      </button>
    </form>
  );
}
