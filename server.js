const express = require('express');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));

const secretKey = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b';

const users = [];

const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); 
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if(file.mimetype === 'application/pdf'){
      cb(null, true);
    }else{
      cb(new Error('Only PDF files are allowed.'),false);
    }
  }
});

app.post('/register', [
  check('username').isLength({ min: 5 }),
  check('password').isLength({ min: 6 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  const userExists = users.find((user) => user.username === username);
  if (userExists) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Registration failed' });
    }

    const newUser = { username, password: hashedPassword };
    users.push(newUser);

    const token = jwt.sign({ username }, secretKey);
    res.status(201).json({ token });
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  bcrypt.compare(password, user.password, (err, result) => {
    if (err || !result) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ username }, secretKey);
    res.status(200).json({ token });
  });
});

app.post('/upload', authenticateToken, upload.single('pdfFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.status(200).json({ message: 'PDF file uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error uploading PDF file' });
  }
});

app.post('/createNewPdf', upload.single('file'), async (req, res) => {
  try {

    console.log(req.files);
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const selectedPages = JSON.parse(decodeURIComponent(req.query.selectedPages));
    console.log(req.query)

    const uploadedFileName = req.file.filename;
    const uploadedFilePath = path.join('uploads', uploadedFileName);
    
   
    const originalPdfBytes = fs.readFileSync(uploadedFilePath);
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    const newPdfDoc = await PDFDocument.create();
    

    console.log(selectedPages)
    for (const page of selectedPages) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [page - 1]);
    
      newPdfDoc.addPage(copiedPage);
     
    }
    
    const newPdfBytes = await newPdfDoc.save();
    
    console.log(newPdfBytes)

    const extractedFileName = 'new_' + Date.now() + '_' + Math.floor(Math.random()* 1000);
    fs.writeFileSync(`extract-pages/${extractedFileName}.pdf`, newPdfBytes);

    const bufferData = Buffer.from(newPdfBytes);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename=yourUint8Array.bin');
  res.send(bufferData);
  } catch (error) {
    console.error('Error creating new PDF', error);
    res.status(500).json({ error: 'Error creating new PDF' });
  }
});

app.get('/protected-route', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});