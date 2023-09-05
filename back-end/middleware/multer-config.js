const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const storage = multer.memoryStorage(); // Utilisation de memoryStorage pour stocker temporairement en mémoire
const upload = multer({ storage: storage }).single('image');

module.exports = (req, res, next) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Image upload failed' });
        }

        // Compress the uploaded image using Sharp
        if (req.file) {
            try {
                const compressedImage = await sharp(req.file.buffer) // Utilisation du buffer en mémoire
                    .jpeg({ quality: 20 }) // Adjust the quality as needed (0 to 100)
                    .toBuffer();

                const imageName = req.file.originalname.split(' ').join('_');
                const extension = MIME_TYPES[req.file.mimetype];
                const fileName = imageName + Date.now() + '.' + extension;

                fs.writeFileSync(`images/${fileName}`, compressedImage); // Écriture du fichier compressé

                req.file.filename = `${fileName}`; // Mise à jour du chemin du fichier pour la suite du processus
                console.log(req.file.filename)
            } catch (sharpErr) {
                console.error(sharpErr);
                return res.status(500).json({ error: 'Image compression failed' });
            }
        }

        next(); // Continue to the next middleware
    });
};

// const multer = require('multer');
//
// const MIME_TYPES = {
//     'image/jpg': 'jpg',
//     'image/jpeg': 'jpg',
//     'image/png': 'png',
// };
//
// const storage = multer.diskStorage({
//     destination: (req, file, callback) => {
//         callback(null, 'images');
//     },
//     filename: (req, file, callback) => {
//         const name = file.originalname.split(' ').join('_');
//         const extension = MIME_TYPES[file.mimetype];
//         callback(null, name + Date.now() + '.' + extension);
//     },
// });
//
// const upload = multer({ storage: storage }).single('image');