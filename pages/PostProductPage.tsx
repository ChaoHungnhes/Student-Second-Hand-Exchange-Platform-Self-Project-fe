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
    getCityCenter("HÃ  Ná»™i"),
  );

  const [formData, setFormData] = useState<PostProductFormData>({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    city: "HÃ  Ná»™i",
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
        "Vui lÃ²ng nháº­p Ä‘á»§ thÃ nh phá»‘ vÃ  phÆ°á»ng/xÃ£ trÆ°á»›c khi chá»n vá»‹ trÃ­ chi tiáº¿t.",
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
        throw new Error("KhÃ´ng tÃ¬m tháº¥y tá»a Ä‘á»™");
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
      console.error("Lá»—i Ä‘á»‹nh vá»‹ tá»« Ä‘á»‹a chá»‰:", error);
      showApiErrorAlert(
        error,
        "KhÃ´ng tÃ¬m tháº¥y khu vá»±c tá»« thÃ´ng tin thÃ nh phá»‘ vÃ  phÆ°á»ng/xÃ£. Báº¡n kiá»ƒm tra láº¡i tÃªn ward nhÃ©.",
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
      console.error("Lá»—i láº¥y Ä‘á»‹a chá»‰ tá»« báº£n Ä‘á»“:", error);
      setFormData((prev) => ({
        ...prev,
        latitude: String(lat),
        longitude: String(lng),
      }));
      setMapCenter([lat, lng]);
      showApiErrorAlert(
        error,
        "ÄÃ£ cáº­p nháº­t tá»a Ä‘á»™, nhÆ°ng chÆ°a láº¥y Ä‘Æ°á»£c Ä‘á»‹a chá»‰ chi tiáº¿t tá»« vá»‹ trÃ­ nÃ y.",
      );
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleCreateDraft = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      alert("Báº¡n cáº§n chá»n vá»‹ trÃ­ chi tiáº¿t trÃªn báº£n Ä‘á»“ trÆ°á»›c khi tiáº¿p tá»¥c.");
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
      console.error("Lá»—i táº¡o báº£n nhÃ¡p:", error);
      showApiErrorAlert(error, "CÃ³ lá»—i xáº£y ra khi táº¡o tin Ä‘Äƒng. Vui lÃ²ng thá»­ láº¡i.");
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
      console.error("Lá»—i upload/submit:", error);
      showApiErrorAlert(error, "ÄÄƒng tin tháº¥t báº¡i á»Ÿ bÆ°á»›c cuá»‘i. Vui lÃ²ng thá»­ láº¡i.");
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
