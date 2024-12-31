const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

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

// Add body-parser middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

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

app.delete('/remove-images', (req, res) => {
  console.log('Received request to delete images', req.body);
  const { filenames } = req.body; // Expecting an array of filenames to delete

  if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
    return res.status(400).send('No filenames provided.');
  }

  const deletePromises = filenames.map(fullPath => {
    const filename = path.basename(fullPath); // Extract the filename from the full path
    const filePath = path.join(uploadsDir, filename);
    return fs.promises.unlink(filePath).catch(err => {
      console.error(`Error deleting file ${filename}:`, err);
      return null; // Return null for failed deletions
    });
  });

  Promise.all(deletePromises).then(results => {
    const deletedFiles = results.filter(result => result !== null);
    res.status(200).json({ message: 'Files deleted successfully'});
  }).catch(err => {
    res.status(500).send('Error deleting files.');
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
