import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

const parseMultipartForm = (req, res, next) => {
  if (!req.headers['content-type'] || !req.headers['content-type'].startsWith('multipart/form-data')) {
    return next();
  }

  // Ensure a local directory exists for temporary uploads.
  // This prevents permission issues on IIS and cross-drive rename errors.
  const uploadDir = path.join(process.cwd(), 'temp_uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({ 
    multiples: true,
    uploadDir: uploadDir,
    keepExtensions: true
  }); 

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Formidable parse error:', err);
      return res.status(400).json({ status: false, message: 'File upload error', errors: [{ msg: err.message }] });
    }

    console.log('--- Raw Fields ---', fields);
    console.log('--- Raw Files ---', files);

    const processedFields = {};
    for (const key in fields) {
      processedFields[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
    }

    const processedFiles = {};
    for (const key in files) {
      processedFiles[key] = Array.isArray(files[key]) ? files[key][0] : files[key];
    }

    req.body = { ...req.body, ...processedFields };

    if (!req.body.data && processedFiles.data) {
        try {
            const fileData = processedFiles.data;
            const content = fs.readFileSync(fileData.filepath, 'utf8');
            req.body.data = content;
            
            delete processedFiles.data;
            console.log('Rescued "data" payload from files object');
        } catch (e) {
            console.error('Error reading "data" part from file stream:', e.message);
        }
    }

    // 1. Handle the 'data' field approach (Common in Postman)
    // If the data was sent as a single JSON string in a field named 'data'
    if (req.body.data && typeof req.body.data === 'string') {
        try {
            const parsedData = JSON.parse(req.body.data);
            req.body = { ...req.body, ...parsedData };
            console.log('Successfully unpacked JSON from "data" field into req.body');
        } catch (e) {
            console.error('Failed to parse JSON from "data" field. Error:', e.message);
            console.error('Raw "data" content:', req.body.data);
        }
    }

    // 2. Handle fields that SHOULD be arrays/objects but were sent as strings
    // (Ensures riders and rankings are usable if sent outside a 'data' blob)
    const jsonFields = ['riders', 'salary_ranking', 'level_ranking', 'payment', 'sub_group_type_id'];
    jsonFields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
            try {
                const parsed = JSON.parse(req.body[field]);
                if (parsed !== null) req.body[field] = parsed;
            } catch (e) {
            }
        }
    });

    console.log('--- Final req.body sent to validators ---', req.body);
    req.files = processedFiles; 
    next();
  });
};

export default parseMultipartForm;