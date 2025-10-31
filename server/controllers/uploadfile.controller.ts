// import express, {Router} from "express";
// import { initializeApp, } from "firebase/app";
// import { getStorage, ref, getDownloadURL, uploadBytesResumable, uploadBytes, listAll} from "firebase/storage"
// import {firebaseConfig} from "../config/firebase.js"
// // import { getAnalytics, isSupported } from "firebase/analytics";
// import { v4 } from "uuid";
// import { uploadimg } from "../utils/multersetup.js";



// const router = express.Router();

// //let firestore;
// if (firebaseConfig.projectId) {
//   // Initialize Firebase
//     const app = initializeApp(firebaseConfig);
//     // const analytics = app.name && typeof window !== 'undefined' ? getAnalytics(app) : null;
//       //firestore = getFirestore();
// }


// export const storage = getStorage(app);


// // const analytics = app.name && typeof window !== 'undefined' ? getAnalytics(app) : null;
// // if(app.analytics){
// //     app.analytics.
// // }
// //const {isSupported, reason} = await analytics.checkEnvSupport()
// //if (!isSupported) {
// //   if (reason === 'analytics/cookies-not-enabled') {
// //     alertUser('Please enable cookies')
// //   }
//   // other reasons...
// //}

// // Async function to handle firebase analtics initialization
// // async function initAnalytics() {
// //     try {
// //         const supported = await isSupported();
// //         if (supported) {
// //             const analytics = getAnalytics();
// //             // Initialize Firebase Analytics or set up your tracking here
// //         } else {
// //             console.warn('Firebase Analytics is not supported in this environment');
// //         }
// //     } catch (error) {
// //         console.error('An error occurred while checking for Firebase Analytics support', error);
// //     }
// // }

// // initAnalytics();


// router.route.post("/", uploadimg.single("inputname"), async (req, res) => {
//     try {
//         //const dateTime = giveCurrentDateTime();
//         const storageRef = ref(storage, `files/images/${req.file.originalname + v4()}`)

//         //creat file metadata including the content type
//         const metadata = {
//             contentType : req.file.mimetype,
//         }

//         //upload the file in the buckt  storage
//         const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata)
//         //by using uploadBytesResumable we can control the progress of uploading like pause, resume

//         //grab the public url
//         const downloadURL = await getDownloadURL(snapshot.ref)
//         console.log(`file successfully uploaded`)
//         return res.send({
//             message: `file uploaded to firebase storage`,
//             name: req.file.originalname,
//             type: req.file.mimetype,
//             downloadURL: downloadURL
//         })
//     }
//     catch {console.log("error uploading image")}
// }
// )

// export default router