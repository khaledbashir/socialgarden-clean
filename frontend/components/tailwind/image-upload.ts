import { createImageUpload } from "novel/plugins";
import { toast } from "sonner";

const onUpload = (file: File) => {
  const promise = fetch("/api/upload", {
    method: "POST",
    headers: {
      "content-type": file?.type || "application/octet-stream",
      "x-vercel-filename": file?.name || "image.png",
    },
    body: file,
  });

  return new Promise((resolve, reject) => {
    toast.promise(
      promise
        .then(async (res) => {
          // Successfully uploaded image to cloud storage
          if (res.status === 200) {
            const { url } = (await res.json()) as { url: string };
            // preload the image
            const image = new Image();
            image.src = url;
            image.onload = () => {
              resolve(url);
            };
            image.onerror = () => {
              reject(new Error("Failed to load uploaded image"));
            };
            // No blob store configured - use local file (this is normal and expected)
          } else if (res.status === 401) {
            // Silently handle local images without error
            console.log("📷 Using local image (cloud storage not configured)");
            resolve(file);
            // Unknown error
          } else {
            const error = new Error("Error uploading image. Please try again.");
            reject(error);
            throw error;
          }
        })
        .catch((error) => {
          // Catch any network or parsing errors
          console.error("Image upload error:", error);
          reject(error);
          throw error;
        }),
      {
        loading: "Uploading image...",
        success: "Image uploaded successfully.",
        error: (e) => {
          return e?.message || "Failed to upload image";
        },
      },
    );
  });
};

export const uploadFn = createImageUpload({
  onUpload,
  validateFn: (file) => {
    if (!file.type.includes("image/")) {
      toast.error("File type not supported.");
      return false;
    }
    if (file.size / 1024 / 1024 > 20) {
      toast.error("File size too big (max 20MB).");
      return false;
    }
    return true;
  },
});
