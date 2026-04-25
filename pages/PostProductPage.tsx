import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createDraftProductAPI,
  forwardGeocodeAPI,
  getCategoriesAPI,
  reverseGeocodeAPI,
  submitProductAPI,
  uploadProductImagesAPI,
} from "../config/api";
import { Category } from "../types/index";

type PostStep = "INFO" | "IMAGES" | "SUBMITTING" | "SUCCESS";
type CityOption = "Hà Nội" | "Hồ Chí Minh";

declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_CSS_ID = "leaflet-css-cdn";
const LEAFLET_SCRIPT_ID = "leaflet-script-cdn";

const cityToApiValue = (city: CityOption) =>
  city === "Hà Nội" ? "Ha Noi" : "Ho Chi Minh";

const normalizeCity = (city?: string): CityOption => {
  const normalized = (city || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return normalized.includes("ho chi minh") ? "Hồ Chí Minh" : "Hà Nội";
};

const getCityCenter = (city: CityOption): [number, number] =>
  city === "Hồ Chí Minh" ? [10.7769, 106.7009] : [21.0285, 105.8542];

const ensureLeafletLoaded = async () => {
  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_CSS_ID;
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
  }

  if (window.L) return window.L;

  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      LEAFLET_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Leaflet load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Leaflet load failed"));
    document.body.appendChild(script);
  });

  return window.L;
};

interface LocationPickerMapProps {
  center: [number, number];
  markerPosition: [number, number] | null;
  visible: boolean;
  onPick: (lat: number, lng: number) => void;
}

const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  center,
  markerPosition,
  visible,
  onPick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible || !containerRef.current) return;

    let cancelled = false;

    const initMap = async () => {
      try {
        const L = await ensureLeafletLoaded();
        if (cancelled || !containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
          center,
          zoom: 16,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
        }).addTo(map);

        const marker = L.marker(markerPosition || center, {
          draggable: true,
        }).addTo(map);

        map.on("click", (event: any) => {
          const { lat, lng } = event.latlng;
          marker.setLatLng([lat, lng]);
          onPick(lat, lng);
        });

        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          onPick(lat, lng);
        });

        mapRef.current = map;
        markerRef.current = marker;

        if (markerPosition) {
          map.setView(markerPosition, 17);
        }

        setTimeout(() => map.invalidateSize(), 0);
      } catch (error) {
        console.error("Khong the tai ban do:", error);
      }
    };

    initMap();

    return () => {
      cancelled = true;
      markerRef.current = null;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, markerPosition, onPick, visible]);

  useEffect(() => {
    if (!visible || !mapRef.current || !markerRef.current) return;

    const target = markerPosition || center;
    markerRef.current.setLatLng(target);
    mapRef.current.setView(target, mapRef.current.getZoom(), { animate: true });
    mapRef.current.invalidateSize();
  }, [center, markerPosition, visible]);

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-2xl border border-gray-200 overflow-hidden"
    />
  );
};

const PostProductPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<PostStep>("INFO");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    getCityCenter("Hà Nội"),
  );

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    city: "Hà Nội" as CityOption,
    ward: "",
    addressDetail: "",
    latitude: "",
    longitude: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res: any = await getCategoriesAPI();
        if (Array.isArray(res)) {
          setCategories(res);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchCats();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "city" || name === "ward") {
        next.addressDetail = "";
        next.latitude = "";
        next.longitude = "";
      }

      return next;
    });

    if (name === "city") {
      setMapVisible(false);
      setMapCenter(getCityCenter(value as CityOption));
    }

    if (name === "ward") {
      setMapVisible(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    setImages((prev) => [...prev, ...filesArray]);

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const canOpenMap = Boolean(formData.city && formData.ward.trim());
  const markerPosition =
    formData.latitude && formData.longitude
      ? ([Number(formData.latitude), Number(formData.longitude)] as [
          number,
          number,
        ])
      : null;

  const handleLocateFromWard = async () => {
    if (!canOpenMap) {
      alert(
        "Vui lòng nhập đủ thành phố và phường/xã trước khi chọn vị trí chi tiết.",
      );
      return;
    }

    setIsLocating(true);

    try {
      const res: any = await forwardGeocodeAPI({
        city: cityToApiValue(formData.city),
        ward: formData.ward.trim(),
      });

      const data = res?.data?.data || res?.data || res;

      if (!data?.latitude || !data?.longitude) {
        throw new Error("Khong tim thay toa do");
      }

      const nextCity = normalizeCity(data.city || formData.city);
      const nextPosition: [number, number] = [
        Number(data.latitude),
        Number(data.longitude),
      ];

      setFormData((prev) => ({
        ...prev,
        city: nextCity,
        ward: data.ward || prev.ward,
        addressDetail: "",
        latitude: String(data.latitude),
        longitude: String(data.longitude),
      }));
      setMapCenter(nextPosition);
      setMapVisible(true);
    } catch (error) {
      console.error("Loi dinh vi tu dia chi:", error);
      alert(
        "Khong tim thay khu vuc tu thong tin thanh pho va phuong/xa. Ban kiem tra lai ten ward nhe.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickLocation = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);

    try {
      const res: any = await reverseGeocodeAPI(lat, lng);
      const data = res?.data?.data || res?.data || res;
      const nextCity = normalizeCity(data.city || formData.city);

      setFormData((prev) => ({
        ...prev,
        city: nextCity,
        ward: data.ward || prev.ward,
        addressDetail: data.addressDetail || "",
        latitude: String(lat),
        longitude: String(lng),
      }));
      setMapCenter([lat, lng]);
    } catch (error) {
      console.error("Loi lay dia chi tu ban do:", error);
      setFormData((prev) => ({
        ...prev,
        latitude: String(lat),
        longitude: String(lng),
      }));
      setMapCenter([lat, lng]);
      alert(
        "Da cap nhat toa do, nhung chua lay duoc dia chi chi tiet tu vi tri nay.",
      );
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      alert("Ban can chon vi tri chi tiet tren ban do truoc khi tiep tuc.");
      return;
    }

    setIsLoading(true);

    try {
      const res: any = await createDraftProductAPI({
        ...formData,
        categoryId: Number(formData.categoryId),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      });

      const data = res?.data?.data || res?.data || res;

      if (data?.id) {
        setDraftId(data.id);
        setStep("IMAGES");
      }
    } catch (error) {
      console.error("Loi tao ban nhap:", error);
      alert("Co loi xay ra khi tao tin dang. Vui long thu lai.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFinal = async () => {
    if (!draftId) return;

    setStep("SUBMITTING");

    try {
      if (images.length > 0) {
        const formDataUpload = new FormData();
        images.forEach((file) => {
          formDataUpload.append("files", file);
        });
        await uploadProductImagesAPI(draftId, formDataUpload);
      }

      await submitProductAPI(draftId);
      setStep("SUCCESS");
    } catch (error) {
      console.error("Loi upload/submit:", error);
      alert("Dang tin that bai o buoc cuoi. Vui long thu lai.");
      setStep("IMAGES");
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center">
        <i className="fa-solid fa-lock text-4xl text-gray-200 mb-4"></i>
        <h2 className="text-xl font-bold text-gray-900">Vui long dang nhap</h2>
        <p className="text-gray-500 mt-2">
          Ban can dang nhap de dang tin ban do.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold"
        >
          Dang nhap ngay
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      <div className="mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-500"
            style={{
              width:
                step === "INFO" ? "0%" : step === "IMAGES" ? "50%" : "100%",
            }}
          ></div>

          {[
            { id: "INFO", icon: "fa-pen-to-square", label: "Thong tin" },
            { id: "IMAGES", icon: "fa-images", label: "Hinh anh" },
            { id: "SUCCESS", icon: "fa-paper-plane", label: "Gui duyet" },
          ].map((s, idx) => (
            <div
              key={s.id}
              className="relative z-10 flex flex-col items-center"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step === s.id ||
                  (step === "SUBMITTING" && s.id === "SUCCESS") ||
                  (step === "SUCCESS" && idx <= 2) ||
                  (step === "IMAGES" && idx === 0)
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                <i className={`fa-solid ${s.icon} text-sm`}></i>
              </div>
              <span
                className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${
                  step === s.id || (step === "SUBMITTING" && s.id === "SUCCESS")
                    ? "text-indigo-600"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {step === "INFO" && (
        <form
          onSubmit={handleCreateDraft}
          className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="border-b border-gray-50 pb-4">
            <h2 className="text-xl font-bold text-gray-900">Mo ta san pham</h2>
            <p className="text-sm text-gray-500">
              Cung cap thong tin chi tiet de nguoi mua de tim thay ban.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Tieu de tin dang *
              </label>
              <input
                required
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Vi du: Giao trinh Giai tich 1 con moi"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Danh muc *
              </label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
              >
                <option value="">Chon danh muc</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Gia ban (VND) *
              </label>
              <input
                required
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="Vi du: 50000"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-600"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                Mo ta chi tiet *
              </label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Mo ta tinh trang san pham, thoi gian da su dung..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              ></textarea>
            </div>
          </div>

          <div className="border-b border-gray-50 pb-4 pt-4">
            <h2 className="text-xl font-bold text-gray-900">
              Địa điểm giao dịch
            </h2>
            <p className="text-sm text-gray-500">
              Chọn thành phố và phường/xã trước, sau đó đánh dấu vị trí chi tiết
              trên bản đồ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Tinh/Thanh pho *
              </label>
              <select
                required
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium appearance-none"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="Hồ Chí Minh">Hồ Chí Minh</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Phuong/Xa *
              </label>
              <input
                required
                name="ward"
                value={formData.ward}
                onChange={handleInputChange}
                placeholder="Bach Khoa, Phuc Son..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Buoc 1: Dinh vi tu thanh pho va phuong/xa
                </p>
                <p className="text-xs text-gray-500">
                  He thong se dat marker vao khu vuc gan dung, sau do ban chon
                  diem chinh xac tren ban do.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLocateFromWard}
                disabled={!canOpenMap || isLocating}
                className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLocating ? "Dang dinh vi..." : "Chon vi tri chi tiet"}
              </button>
            </div>

            {!mapVisible && (
              <div className="rounded-xl border border-dashed border-indigo-200 bg-white/80 px-4 py-5 text-sm text-gray-500">
                Nhap day du thanh pho va phuong/xa, sau do bam "Chon vi tri chi
                tiet" de mo ban do.
              </div>
            )}

            <LocationPickerMap
              center={mapCenter}
              markerPosition={markerPosition}
              visible={mapVisible}
              onPick={handlePickLocation}
            />

            {mapVisible && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 border border-gray-200">
                    <i className="fa-solid fa-location-crosshairs text-indigo-500"></i>
                    {isReverseGeocoding
                      ? "Dang cap nhat dia chi..."
                      : "Click ban do hoac keo marker de chon diem"}
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
                      Dia chi chi tiet
                    </label>
                    <input
                      name="addressDetail"
                      value={formData.addressDetail}
                      onChange={handleInputChange}
                      placeholder="Se tu dong dien sau khi ban chon vi tri, ban co the sua lai neu can"
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
                Tiep tuc tai anh <i className="fa-solid fa-arrow-right"></i>
              </>
            )}
          </button>
        </form>
      )}

      {step === "IMAGES" && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Hinh anh san pham
            </h2>
            <p className="text-gray-500 mt-1">
              Nen dang tu 2-4 anh that cua san pham de tang ti le ban hang.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-pointer group"
          >
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-cloud-arrow-up text-indigo-600 text-2xl"></i>
            </div>
            <p className="font-bold text-gray-700">
              Nhan de tai len hoac keo tha
            </p>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-black">
              PNG, JPG toi da 10MB
            </p>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 shadow-sm group"
                >
                  <img src={url} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setStep("INFO")}
              className="flex-1 border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
            >
              Quay lai
            </button>
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={images.length === 0}
              className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              Hoan tat & Gui duyet <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      {step === "SUBMITTING" && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-indigo-100 space-y-8 animate-in zoom-in-95 duration-500">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-robot text-4xl text-indigo-600"></i>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dang tai anh & Gui duyet...
            </h2>
            <p className="text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
              He thong dang tai hinh anh len va gui bai dang cua ban toi Admin
              kiem duyet.
            </p>
          </div>
        </div>
      )}

      {step === "SUCCESS" && (
        <div className="bg-white rounded-3xl p-12 text-center shadow-xl border border-green-100 space-y-6 animate-in slide-in-from-top-4 duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 text-4xl shadow-lg shadow-green-100">
            <i className="fa-solid fa-check"></i>
          </div>
          <h2 className="text-3xl font-black text-gray-900">
            Dang tin thanh cong!
          </h2>

          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-left space-y-2 text-center">
            <p className="text-gray-700 font-medium">
              Tin cua ban dang o trang thai{" "}
              <span className="text-yellow-600 font-bold uppercase">
                CHO DUYET
              </span>
              .
            </p>
            <p className="text-sm text-gray-500">
              Vui long doi Admin kiem duyet noi dung truoc khi duoc hien thi
              cong khai.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => navigate("/my-shop")}
              className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-black transition-all"
            >
              Quan ly tin dang
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-white text-indigo-600 border-2 border-indigo-600 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all"
            >
              Ve trang chu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostProductPage;
