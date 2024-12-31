const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use('/uploads', express.static('uploads'));

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

const upload = multer({ storage });

app.post('/upload-images', upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    // Create a new file if no files are uploaded
    const filePath = 'uploads/no-files-uploaded.txt';
    fs.writeFile(filePath, 'No files were uploaded.', (err) => {
      if (err) {
        return res.status(500).send('Error creating file.');
      }
      return res.status(400).send('No images uploaded. A file has been created.');
    });
  }
  
  const filePaths = req.files.map(file => file.path); 
  res.status(200).json({ message: 'Images uploaded successfully', files: filePaths });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
