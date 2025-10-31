import multer from "multer";


const filter = (req, file, cb) => {
    if(file.mimetype === "image/jpeg" || file.mimetype === "image/jpg" || file.mimetype === "image/webp"){
        cb(null, true)
    }
    // else(
    //     {"error" : "Unsupported file format. Upload only jpeg, jpg or webp"},
    //     false
    // )
}

const memstorage = multer.memoryStorage({
    filenane: (req, file, cb)=>{
        cb(null, file.originalname.toLocaleLowerCase() + new Date().toString())
    },
})


export const uploadimg = multer({ storage: memstorage, limits: {fieldSize: 1024 * 5012}, fileFilter: filter })
