import React from "react";
import { Category } from "../../types/index";
import { ProductEditForm } from "./types";

interface ProductEditModalProps {
  categories: Category[];
  editForm: ProductEditForm;
  onClose: () => void;
  onFormChange: (form: ProductEditForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({
  categories,
  editForm,
  onClose,
  onFormChange,
  onSubmit,
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    ></div>
    <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
      <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Chỉnh sửa tin đăng
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Tiêu đề sản phẩm
            </label>
            <input
              type="text"
              required
              value={editForm.title}
              onChange={(e) =>
                onFormChange({ ...editForm, title: e.target.value })
              }
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Giá bán (VNĐ)
              </label>
              <input
                type="number"
                required
                value={editForm.price}
                onChange={(e) =>
                  onFormChange({
                    ...editForm,
                    price: Number(e.target.value),
                  })
                }
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-gray-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Danh mục
              </label>
              <select
                value={editForm.categoryId}
                onChange={(e) =>
                  onFormChange({
                    ...editForm,
                    categoryId: Number(e.target.value),
                  })
                }
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-bold text-gray-900 appearance-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Mô tả sản phẩm
            </label>
            <textarea
              rows={4}
              required
              value={editForm.description}
              onChange={(e) =>
                onFormChange({ ...editForm, description: e.target.value })
              }
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white transition-all outline-none font-medium text-gray-700"
            ></textarea>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <input
              placeholder="Tỉnh/Thành"
              className="p-4 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-sm"
              value={editForm.city}
              onChange={(e) =>
                onFormChange({ ...editForm, city: e.target.value })
              }
            />
            <input
              placeholder="Phường/Xã"
              className="p-4 rounded-2xl bg-gray-50 border border-gray-100 font-bold text-sm"
              value={editForm.ward}
              onChange={(e) =>
                onFormChange({ ...editForm, ward: e.target.value })
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
              Địa chỉ cụ thể
            </label>
            <input
              value={editForm.addressDetail}
              onChange={(e) =>
                onFormChange({
                  ...editForm,
                  addressDetail: e.target.value,
                })
              }
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 transition-all outline-none font-bold text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={editForm.latitude}
                onChange={(e) =>
                  onFormChange({ ...editForm, latitude: e.target.value })
                }
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 transition-all outline-none font-bold text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={editForm.longitude}
                onChange={(e) =>
                  onFormChange({ ...editForm, longitude: e.target.value })
                }
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 transition-all outline-none font-bold text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            LƯU THAY ĐỔI
          </button>
        </form>
      </div>
    </div>
  </div>
);

export default ProductEditModal;
