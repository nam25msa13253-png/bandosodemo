import { asc, eq } from "drizzle-orm";
import { KeyRound, Lock, Unlock, UserPlus } from "lucide-react";
import { db, schema as s } from "@/db";
import { requireUser } from "@/lib/auth";
import { getVillages } from "@/lib/settings";
import { formatDate } from "@/lib/text";
import { AdminTitle, Flash } from "@/components/admin/ui";
import { changeOwnPassword, createUser, updateUser } from "./actions";

const ERR: Record<string, string> = {
  username: "Tên đăng nhập 3–30 ký tự, chỉ gồm chữ thường không dấu, số, dấu chấm/gạch.",
  password: "Mật khẩu tối thiểu 8 ký tự, có cả chữ và số.",
  village: "Tài khoản cán bộ tổ phải chọn tổ dân phố.",
  exists: "Tên đăng nhập đã tồn tại.",
  self: "Không thể tự khoá tài khoản của mình.",
  current: "Mật khẩu hiện tại không đúng.",
};
const MSG: Record<string, string> = { created: "Đã tạo tài khoản.", saved: "Đã lưu.", pw: "Đã đổi mật khẩu." };

export default async function Accounts({ searchParams }: { searchParams: Promise<{ msg?: string; err?: string }> }) {
  const me = await requireUser();
  const { msg, err } = await searchParams;
  const isAdmin = me.role === "ADMIN";
  const [users, villages] = await Promise.all([
    isAdmin
      ? db.select({ u: s.users, v: s.villages.name }).from(s.users).leftJoin(s.villages, eq(s.villages.id, s.users.villageId)).orderBy(asc(s.users.role), asc(s.users.username))
      : Promise.resolve([]),
    getVillages(),
  ]);
  return (
    <>
      <AdminTitle title="Tài khoản" />
      <Flash msg={msg ? MSG[msg] : undefined} err={err ? ERR[err] : undefined} />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {isAdmin && (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                  <tr><th className="px-3 py-2.5">Tài khoản</th><th className="px-3 py-2.5">Vai trò</th><th className="px-3 py-2.5">Đăng nhập gần nhất</th><th className="px-3 py-2.5">Thao tác</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(({ u, v }) => (
                    <tr key={u.id} className={u.active ? "" : "text-slate-400"}>
                      <td className="px-3 py-2"><b>{u.username}</b><br /><span className="text-xs">{u.fullName}</span></td>
                      <td className="px-3 py-2">{u.role === "ADMIN" ? "Quản trị phường" : `Cán bộ ${v ?? ""}`}{!u.active && " (đã khoá)"}</td>
                      <td className="px-3 py-2 text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt, true) : "Chưa"}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          <form action={updateUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <button name="op" value="toggle" className="btn btn-outline px-2 py-1 text-xs">{u.active ? <><Lock className="h-3.5 w-3.5" /> Khoá</> : <><Unlock className="h-3.5 w-3.5" /> Mở</>}</button>
                          </form>
                          <form action={updateUser} className="flex gap-1">
                            <input type="hidden" name="id" value={u.id} />
                            <input name="password" placeholder="Mật khẩu mới" className="input w-32 py-1 text-xs" />
                            <button name="op" value="reset" className="btn btn-outline px-2 py-1 text-xs"><KeyRound className="h-3.5 w-3.5" /> Đặt lại</button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {isAdmin && (
            <form action={createUser} className="card grid gap-3 p-4 sm:grid-cols-2">
              <p className="font-bold text-slate-800 sm:col-span-2">Tạo tài khoản mới</p>
              <div><label className="label">Tên đăng nhập</label><input name="username" required className="input" placeholder="vd: tdp5" /></div>
              <div><label className="label">Họ tên</label><input name="fullName" required className="input" /></div>
              <div><label className="label">Mật khẩu ban đầu</label><input name="password" required className="input" /></div>
              <div>
                <label className="label">Vai trò</label>
                <select name="role" className="input">
                  <option value="VILLAGE">Cán bộ tổ dân phố</option>
                  <option value="ADMIN">Quản trị phường</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Tổ dân phố (cho cán bộ tổ)</label>
                <select name="villageId" className="input">
                  <option value="">—</option>
                  {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <button className="btn btn-primary sm:col-span-2"><UserPlus className="h-4 w-4" /> Tạo tài khoản</button>
            </form>
          )}
        </div>
        <form action={changeOwnPassword} className="card h-fit space-y-3 p-4">
          <p className="font-bold text-slate-800">Đổi mật khẩu của tôi</p>
          <div><label className="label">Mật khẩu hiện tại</label><input type="password" name="current" required className="input" /></div>
          <div><label className="label">Mật khẩu mới</label><input type="password" name="next" required className="input" /></div>
          <button className="btn btn-primary w-full">Đổi mật khẩu</button>
        </form>
      </div>
    </>
  );
}
