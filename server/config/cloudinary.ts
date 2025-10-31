import { v2 as cloudinary } from 'cloudinary';
import streamifier from "streamifier"





// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});



const uploadCloudinary = async (buffer, folder) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve({
              publicId: result.public_id,
              url: result.secure_url,
            });
          }
        }
      ).end(buffer);
  
      // const stream = streamifier.createReadStream(buffer);
      // stream.pipe(uploadStream);
    });
  };
  


export default {uploadCloudinary, cloudinary}

// cloudinary.v2.api
//   .delete_resources(['succo/img/stocks/mxaeevqkf9dop4vnv5w7'], 
//     { type: 'upload', resource_type: 'image' })
//   .then(console.log);