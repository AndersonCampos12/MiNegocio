import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurarnos de que la carpeta exista
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Las guarda en la carpeta /uploads en la raíz del backend
    },
    filename: (req, file, cb) => {
        // Renombra el archivo: fecha-actual-nombreoriginal.jpg
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
    }
});

export const upload = multer({ storage });