export const getApiErrorPayload = (error) => {
  const responseData = error?.response?.data;

  if (responseData && typeof responseData === "object") {
    return responseData;
  }

  return null;
};

export const getApiErrorMessage = (error, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") => {
  if (error?.apiMessage) return error.apiMessage;

  const data = getApiErrorPayload(error);
  const message =
    data?.resultDesc ||
    data?.message ||
    data?.error ||
    data?.data?.resultDesc ||
    data?.data?.message ||
    data?.data?.error;

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};

export const showApiErrorAlert = (error, fallback) => {
  alert(getApiErrorMessage(error, fallback));
};
