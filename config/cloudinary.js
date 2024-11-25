const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary config
cloudinary.config({
  cloud_name: "dfubtb083",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'z-social',
  },
});

function removeFromCloudinary(public_id) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(public_id, (result) => {
      resolve(result);
    });
  });
}

module.exports = { storage, removeFromCloudinary };
