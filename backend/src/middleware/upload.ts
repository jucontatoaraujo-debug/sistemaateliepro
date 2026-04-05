import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const createStorage = (subfolder: string) =>
  multer.diskStorage({
    destination: (_, __, cb) => {
      const dir = path.join(process.cwd(), 'uploads', subfolder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uuidv4()}${ext}`);
    },
  });

const imageFilter = (_: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Apenas imagens são permitidas.'));
};

const embroideryFilter = (_: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.dst', '.pes', '.jef', '.exp', '.vp3', '.xxx', '.hus', '.pec'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Formato de arquivo de bordado não suportado.'));
};

const anyFileFilter = (_: Express.Request, __: Express.Multer.File, cb: multer.FileFilterCallback) => {
  cb(null, true);
};

const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760');

export const uploadImage = multer({ storage: createStorage('arts'), fileFilter: imageFilter, limits: { fileSize: MAX_SIZE } });
export const uploadMatrix = multer({ storage: createStorage('matrices'), fileFilter: embroideryFilter, limits: { fileSize: MAX_SIZE } });
export const uploadClientFile = multer({ storage: createStorage('clients'), fileFilter: anyFileFilter, limits: { fileSize: MAX_SIZE } });
