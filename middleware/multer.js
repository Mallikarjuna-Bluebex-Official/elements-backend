import multer from 'multer';

const storage = multer.diskStorage({//create disk storage configuration
    filename: function(req,file,callback){//define file name
        callback(null,file.originalname)
    }
})

const upload = multer({storage})

export default upload