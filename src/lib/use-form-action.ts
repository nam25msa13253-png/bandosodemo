"use client";
import { startTransition, useActionState } from "react";

/**
 * Giống useActionState nhưng KHÔNG xoá dữ liệu đã nhập khi máy chủ báo lỗi
 * (React 19 mặc định reset form sau mỗi lần gửi qua thuộc tính action).
 */
export function useFormAction<S>(fn: (prev: Awaited<S>, form: FormData) => Promise<S>, initial: Awaited<S>) {
  const [state, action, pending] = useActionState<S, FormData>(fn, initial);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  return { state, onSubmit, pending };
}
