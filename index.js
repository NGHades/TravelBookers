import { v2 as cloudinary } from "cloudinary";

(async function initCloudinaryDemo() {
  try {
    cloudinary.config({
      cloud_name: "dmk35pgnq",
      api_key: "891791239813537",
      api_secret: "<your_api_secret>",
    });

    const uploadResult = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
      {
        public_id: "shoes",
      }
    );

    console.log("Upload result:", uploadResult);

    const optimizeUrl = cloudinary.url("shoes", {
      fetch_format: "auto",
      quality: "auto",
    });

    console.log("Optimized URL:", optimizeUrl);

    const autoCropUrl = cloudinary.url("shoes", {
      crop: "auto",
      gravity: "auto",
      width: 500,
      height: 500,
    });

    console.log("Auto-cropped URL:", autoCropUrl);
  } catch (error) {
    console.error("Cloudinary setup error:", error);
  }
})();

