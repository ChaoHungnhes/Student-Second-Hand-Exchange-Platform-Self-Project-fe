import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createCategoryAPI,
  deleteCategoryAPI,
  getCategoriesAPI,
  getCategoryByIdAPI,
  updateCategoryAPI,
} from "../../config/api";
import { getApiErrorMessage } from "../../utils/apiError";

type Category = { id: number; name: string };
type FormMode = "create" | "edit";
type ToastType = "success" | "error";

const fieldClass =
  "w-full rounded-2xl border bg-white px-4 py-3 text-sm font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:ring-4";

const validateName = (value: string) => {
  if (!value) return "Vui lòng nhập tên danh mục";
  if (!value.trim()) return "Tên danh mục không được chỉ gồm khoảng trắng";
  if (value.length > 100) return "Tên danh mục tối đa 100 ký tự";
  return "";
};

const getFriendlyError = (error: any) => {
  const status = error?.response?.status;
  if (status === 401) return "Vui lòng đăng nhập lại";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này";
  if (status === 500) return "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau";
  return getApiErrorMessage(error, "Có lỗi xảy ra. Vui lòng thử lại.");
};

const AdminCategoryManagement: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{
    type: ToastType;
    message: string;
  } | null>(null);
  const [keyword, setKeyword] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selected, setSelected] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const [detail, setDetail] = useState<Category | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const nameError = validateName(name);
  const filtered = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(keyword.trim().toLowerCase()),
      ),
    [categories, keyword],
  );

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleError = (err: any) => {
    const message = getFriendlyError(err);
    if (err?.response?.status === 401) navigate("/login");
    showToast("error", message);
    return message;
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = (await getCategoriesAPI()) as unknown as Category[];
      setCategories(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(handleError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setFormMode("create");
    setSelected(null);
    setName("");
    setTouched(false);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setFormMode("edit");
    setSelected(category);
    setName(category.name);
    setTouched(false);
    setFormOpen(true);
  };

  const openDetail = async (category: Category) => {
    try {
      setDetailLoading(true);
      setDetail(category);
      const res = (await getCategoryByIdAPI(
        category.id,
      )) as unknown as Category;
      setDetail(res);
    } catch (err: any) {
      setDetail(null);
      handleError(
        err?.response?.status === 404
          ? {
              ...err,
              apiMessage: getApiErrorMessage(err, "Không tìm thấy danh mục"),
            }
          : err,
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError) return;
    try {
      setActionLoading(true);
      const payload = { name: name.trim() };
      if (formMode === "create") {
        const created = (await createCategoryAPI(
          payload,
        )) as unknown as Category;
        setCategories((prev) => [...prev, created]);
        showToast("success", "Tạo danh mục thành công");
      } else if (selected) {
        const updated = (await updateCategoryAPI(
          selected.id,
          payload,
        )) as unknown as Category;
        setCategories((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item)),
        );
        showToast("success", "Cập nhật danh mục thành công");
      }
      setFormOpen(false);
      setName("");
      setSelected(null);
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await deleteCategoryAPI(deleteTarget.id);
      setCategories((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id),
      );
      showToast("success", "Xóa danh mục thành công");
      setDeleteTarget(null);
    } catch (err) {
      handleError(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-2xl px-5 py-3 text-sm font-black shadow-2xl ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}
        >
          {toast.message}
        </div>
      )}

      <section className="overflow-hidden rounded-[2rem] border border-teal-100 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-600">
              Category Management
            </p>
            <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Quản lý danh mục
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Xem, thêm, sửa và xóa danh mục sản phẩm trong hệ thống S2S.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl shadow-slate-900/15 hover:bg-teal-600"
          >
            <i className="fa-solid fa-plus mr-2" />
            Thêm danh mục
          </button>
        </div>
      </section>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-900/5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tên danh mục..."
            className={`${fieldClass} border-slate-200 focus:border-teal-300 focus:ring-teal-100 sm:max-w-sm`}
          />
          <button
            onClick={fetchCategories}
            disabled={loading}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            <i
              className={`fa-solid fa-rotate ${loading ? "animate-spin" : ""} mr-2`}
            />
            Tải lại
          </button>
        </div>
        {error && (
          <div className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-400">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Tên danh mục</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-12 text-center font-bold text-slate-400"
                  >
                    <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                    Đang tải danh sách...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center">
                    <div className="mx-auto max-w-sm rounded-3xl bg-slate-50 p-8">
                      <i className="fa-solid fa-layer-group text-3xl text-slate-300" />
                      <p className="mt-3 font-black text-slate-700">
                        Chưa có danh mục
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        Hãy tạo danh mục đầu tiên để bắt đầu.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {!loading &&
                filtered.map((category) => (
                  <tr key={category.id} className="border-b border-slate-50">
                    <td className="px-4 py-4 font-black text-slate-500">
                      #{category.id}
                    </td>
                    <td className="px-4 py-4 font-bold text-slate-900">
                      {category.name}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openDetail(category)}
                          className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-black text-sky-700"
                        >
                          Xem
                        </button>
                        <button
                          onClick={() => openEdit(category)}
                          className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => setDeleteTarget(category)}
                          className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={submitForm}
            className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-teal-600">
                  {formMode === "create" ? "Thêm mới" : "Cập nhật"}
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  {formMode === "create" ? "Thêm danh mục" : "Sửa danh mục"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-2 text-slate-500"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Tên danh mục
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              maxLength={120}
              className={`${fieldClass} ${touched && nameError ? "border-rose-300 focus:ring-rose-100" : "border-slate-200 focus:border-teal-300 focus:ring-teal-100"}`}
              placeholder="Nhập tên danh mục"
            />
            {touched && nameError && (
              <p className="mt-2 text-sm font-bold text-rose-600">
                {nameError}
              </p>
            )}
            <p className="mt-2 text-xs font-bold text-slate-400">
              {name.length}/100 ký tự
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600"
              >
                Hủy
              </button>
              <button
                disabled={!!nameError || actionLoading}
                className="rounded-2xl bg-teal-600 px-5 py-3 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading && (
                  <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                )}
                {formMode === "create" ? "Tạo danh mục" : "Lưu thay đổi"}
              </button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-sky-600">
                  Chi tiết
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  Danh mục #{detail.id}
                </h3>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="rounded-full bg-slate-100 px-3 py-2 text-slate-500"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            {detailLoading ? (
              <div className="py-10 text-center font-bold text-slate-400">
                <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                Đang tải...
              </div>
            ) : (
              <div className="mt-5 space-y-3 rounded-3xl bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-500">
                  ID: <span className="text-slate-950">{detail.id}</span>
                </p>
                <p className="text-sm font-bold text-slate-500">
                  Tên danh mục:{" "}
                  <span className="text-slate-950">{detail.name}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <i className="fa-solid fa-trash" />
            </div>
            <h3 className="text-center text-2xl font-black text-slate-950">
              Xóa danh mục?
            </h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Bạn có chắc muốn xóa danh mục này không?
            </p>
            <p className="mt-3 text-center font-black text-slate-800">
              {deleteTarget.name}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={actionLoading}
                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-600"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                disabled={actionLoading}
                className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60"
              >
                {actionLoading && (
                  <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                )}
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoryManagement;
