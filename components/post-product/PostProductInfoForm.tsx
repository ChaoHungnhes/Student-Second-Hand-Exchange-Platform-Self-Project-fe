import React from "react";
import { Category } from "../../types/index";
import LocationPickerMap from "./LocationPickerMap";
import { CityOption } from "./locationUtils";

export interface PostProductFormData {
  title: string;
  description: string;
  price: string;
  categoryId: string;
  city: CityOption;
  ward: string;
  addressDetail: string;
  latitude: string;
  longitude: string;
}

interface PostProductInfoFormProps {
  categories: Category[];
  formData: PostProductFormData;
  isLoading: boolean;
  isLocating: boolean;
  isReverseGeocoding: boolean;
  mapCenter: [number, number];
  mapVisible: boolean;
  markerPosition: [number, number] | null;
  canOpenMap: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onLocateFromWard: () => void;
  onPickLocation: (lat: number, lng: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const PostProductInfoForm: React.FC<PostProductInfoFormProps> = ({
  categories,
  formData,
  isLoading,
  isLocating,
  isReverseGeocoding,
  mapCenter,
  mapVisible,
  markerPosition,
  canOpenMap,
  onChange,
  onLocateFromWard,
  onPickLocation,
  onSubmit,
}) => (
  <form
    onSubmit={onSubmit}
    className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
  >
    <div className="border-b border-gray-50 pb-4">
      <h2 className="text-xl font-bold text-gray-900">Mô tả sản phẩm</h2>
      <p className="text-sm text-gray-500">
        Cung cấp thông tin chi tiết để người mua dễ tìm thấy bạn.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Tiêu đề tin đăng *
        </label>
        <input
          required
          name="title"
          value={formData.title}
          onChange={onChange}
          placeholder="Ví dụ: Giáo trình Giải tích 1 còn mới"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Danh mục *
        </label>
        <select
          required
          name="categoryId"
          value={formData.categoryId}
          onChange={onChange}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
        >
          <option value="">Chọn danh mục</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Giá bán (VND) *
        </label>
        <input
          required
          type="number"
          name="price"
          value={formData.price}
          onChange={onChange}
          placeholder="Ví dụ: 50000"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
        />
      </div>

      <div className="md:col-span-2 space-y-2">
        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Mô tả chi tiết *
        </label>
        <textarea
          required
          name="description"
          value={formData.description}
          onChange={onChange}
          rows={4}
          placeholder="Mô tả tình trạng sản phẩm, thời gian đã sử dụng..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        ></textarea>
      </div>
    </div>

    <div className="border-b border-gray-50 pb-4 pt-4">
      <h2 className="text-xl font-bold text-gray-900">Địa điểm giao dịch</h2>
      <p className="text-sm text-gray-500">
        Chọn thành phố và phường/xã trước, sau đó đánh dấu vị trí chi tiết trên
        bản đồ.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Tỉnh/Thành phố *
        </label>
        <select
          required
          name="city"
          value={formData.city}
          onChange={onChange}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none"
        >
          <option value="Hà Nội">Hà Nội</option>
          <option value="Hồ Chí Minh">Hồ Chí Minh</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Phường/Xã *
        </label>
        <input
          required
          name="ward"
          value={formData.ward}
          onChange={onChange}
          placeholder="Bách Khoa, Phúc Sơn..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>
    </div>

    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-gray-900">
            Bước 1: Định vị từ thành phố và phường/xã
          </p>
          <p className="text-xs text-gray-500">
            Hệ thống sẽ đặt marker vào khu vực gần đúng, sau đó bạn chọn điểm
            chính xác trên bản đồ.
          </p>
        </div>
        <button
          type="button"
          onClick={onLocateFromWard}
          disabled={!canOpenMap || isLocating}
          className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLocating ? "Đang định vị..." : "Chọn vị trí chi tiết"}
        </button>
      </div>

      {!mapVisible && (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-white/80 px-4 py-5 text-sm text-gray-500">
          Nhập đầy đủ thành phố và phường/xã, sau đó bấm "Chọn vị trí chi tiết"
          để mở bản đồ.
        </div>
      )}

      <LocationPickerMap
        center={mapCenter}
        markerPosition={markerPosition}
        visible={mapVisible}
        onPick={onPickLocation}
      />

      {mapVisible && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-gray-200">
              <i className="fa-solid fa-location-crosshairs text-indigo-500"></i>
              {isReverseGeocoding
                ? "Đang cập nhật địa chỉ..."
                : "Bấm lên bản đồ hoặc kéo marker để chọn điểm"}
            </span>
            {formData.latitude && formData.longitude && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-gray-200">
                {Number(formData.latitude).toFixed(6)},{" "}
                {Number(formData.longitude).toFixed(6)}
              </span>
            )}
          </div>

          {formData.latitude && formData.longitude && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Địa chỉ chi tiết
              </label>
              <input
                name="addressDetail"
                value={formData.addressDetail}
                onChange={onChange}
                placeholder="Sẽ tự động điền sau khi bạn chọn vị trí, bạn có thể sửa lại nếu cần"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          )}
        </div>
      )}
    </div>

    <button
      type="submit"
      disabled={isLoading}
      className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
    >
      {isLoading ? (
        <i className="fa-solid fa-circle-notch animate-spin"></i>
      ) : (
        <>
          Tiếp tục tải ảnh <i className="fa-solid fa-arrow-right"></i>
        </>
      )}
    </button>
  </form>
);

export default PostProductInfoForm;
