const express = require('express');
const multer = require('multer');
const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');

dotenv.config({path:__dirname+'/../.env'})

aws.config.update({
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey,
  region: process.env.AWSRegion // us-east-1
});

const s3 = new aws.S3();

const app = express();
app.use(cors());

// Configure multer middleware to handle file uploads
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSBucket,
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString()); // Date.toString() used for key, uid() would be more suitable for app of greater scale. 
    }
  })
});

// Upload API request, receives a video and uses multer to upload to S3 bucket 
app.post('/upload', upload.single('video'), (req, res) => {
  console.log("upload attempted")
  if (req.file) {
    // The file was uploaded successfully

    const url = req.file.location;
    res.json({ url: url }); // url sent back to frontend to inform user of video id
  } else {
    // An error occurred during the upload
    res.status(400).json({ error: 'File upload failed' });
  }
});

// Download api request
app.get('/:key', (req, res) => {
  console.log("video requested");
  if (req.params.key){
  new aws.S3().getObject({ Bucket: process.env.AWSBucket, Key: req.params.key }, function(err, data)
  {
    console.log(data);
    if (!err)
      console.log(data);
      res.attachment(req.params.Key); // Set Filename
      res.type(data.ContentType); // Set FileType
      res.send(data.Body);        // Send Video
  });
} else{
  console.log("no key supplied")
  res.status(400).json({ error: 'No key supplied' });
}
});

// Start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

module.exports = app;