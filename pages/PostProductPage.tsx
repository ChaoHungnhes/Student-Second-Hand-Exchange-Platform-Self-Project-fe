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
import PostProductImagesStep from "../components/post-product/PostProductImagesStep";
import PostProductInfoForm, {
  PostProductFormData,
} from "../components/post-product/PostProductInfoForm";
import PostStepIndicator, {
  PostStep,
} from "../components/post-product/PostStepIndicator";
import {
  LoginRequired,
  SubmittingState,
  SuccessState,
} from "../components/post-product/PostProductStates";
import {
  CityOption,
  cityToApiValue,
  getCityCenter,
  normalizeCity,
} from "../components/post-product/locationUtils";
import { showApiErrorAlert } from "../utils/apiError";

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
    getCityCenter("Hà N?i"),
  );

  const [formData, setFormData] = useState<PostProductFormData>({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    city: "Hà N?i",
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
    setPreviews((prev) => [
      ...prev,
      ...filesArray.map((file) => URL.createObjectURL(file)),
    ]);
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
        "Vui lòng nh?p d? thành ph? và phu?ng/xã tru?c khi ch?n v? trí chi ti?t.",
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
        throw new Error("Không tìm th?y t?a d?");
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
      console.error("L?i d?nh v? t? d?a ch?:", error);
      showApiErrorAlert(
        error,
        "Không tìm th?y khu v?c t? thông tin thành ph? và phu?ng/xã. B?n ki?m tra l?i tên ward nhé.",
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
      console.error("L?i l?y d?a ch? t? b?n d?:", error);
      setFormData((prev) => ({
        ...prev,
        latitude: String(lat),
        longitude: String(lng),
      }));
      setMapCenter([lat, lng]);
      showApiErrorAlert(
        error,
        "Ðã c?p nh?t t?a d?, nhung chua l?y du?c d?a ch? chi ti?t t? v? trí này.",
      );
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      alert("B?n c?n ch?n v? trí chi ti?t trên b?n d? tru?c khi ti?p t?c.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        categoryId: Number(formData.categoryId),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      };

      console.log("[createDraftProductAPI] POST /s2s/products/createDraft payload:", payload);

      const res: any = await createDraftProductAPI(payload);

      const data = res?.data?.data || res?.data || res;

      if (data?.id) {
        setDraftId(data.id);
        setStep("IMAGES");
      }
    } catch (error) {
      console.error("L?i t?o b?n nháp:", error);
      showApiErrorAlert(error, "Có l?i x?y ra khi t?o tin dang. Vui lòng th? l?i.");
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
      console.error("L?i upload/submit:", error);
      showApiErrorAlert(error, "Ðang tin th?t b?i ? bu?c cu?i. Vui lòng th? l?i.");
      setStep("IMAGES");
    }
  };

  if (!user) {
    return <LoginRequired onLogin={() => navigate("/login")} />;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      <PostStepIndicator step={step} />

      {step === "INFO" && (
        <PostProductInfoForm
          categories={categories}
          formData={formData}
          isLoading={isLoading}
          isLocating={isLocating}
          isReverseGeocoding={isReverseGeocoding}
          mapCenter={mapCenter}
          mapVisible={mapVisible}
          markerPosition={markerPosition}
          canOpenMap={canOpenMap}
          onChange={handleInputChange}
          onLocateFromWard={handleLocateFromWard}
          onPickLocation={handlePickLocation}
          onSubmit={handleCreateDraft}
        />
      )}

      {step === "IMAGES" && (
        <PostProductImagesStep
          fileInputRef={fileInputRef}
          imagesCount={images.length}
          previews={previews}
          onBack={() => setStep("INFO")}
          onImageChange={handleImageChange}
          onRemoveImage={removeImage}
          onSubmitFinal={handleSubmitFinal}
        />
      )}

      {step === "SUBMITTING" && <SubmittingState />}

      {step === "SUCCESS" && (
        <SuccessState
          onGoHome={() => navigate("/")}
          onGoToShop={() => navigate("/my-shop")}
        />
      )}
    </div>
  );
};

export default PostProductPage;
