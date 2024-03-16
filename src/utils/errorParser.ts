export const errorParser = (error: any): string => {
  const errMsg =
    error?.response?.data?.message ||
    error?.response?.statusText ||
    error?.message;
  if (
    errMsg?.includes("timeout") ||
    errMsg?.includes("Network Error") ||
    errMsg?.includes("timed out")
  ) {
    return "There was a network error. Please Check your internet connection and try again.";
  } else {
    return errMsg || "An error occurred.";
  }
};
