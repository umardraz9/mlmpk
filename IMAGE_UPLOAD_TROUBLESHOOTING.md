# 🖼️ Image Upload Troubleshooting Guide

## Problem
When uploading images in the product creation form, users receive error:
```
Failed to upload 2 image(s). download-1.jpeg: Please try again later; images-1.jpeg: Please try again later
```

## Root Causes & Solutions

### 1. **Directory Permission Issues** ❌ → ✅
**Problem**: Upload directory doesn't exist or lacks write permissions
**Solution**: 
- Ensure `/public/uploads/images/` directory exists
- Check directory permissions (should be writable)
- Backend creates directories automatically with `mkdir({ recursive: true })`

### 2. **File System Errors** ❌ → ✅
**Problem**: File write fails due to disk space, permissions, or path issues
**Solution**:
- Check available disk space
- Verify file permissions on `/public/uploads/`
- Ensure file path is valid and not too long

### 3. **Authentication Issues** ❌ → ✅
**Problem**: Session not properly passed to upload endpoint
**Solution**:
- Frontend includes `credentials: 'include'` in fetch request
- Backend validates session with `requireAuth()`
- Session cookie must be valid and not expired

### 4. **File Validation Failures** ❌ → ✅
**Problem**: File type or size validation fails
**Solution**:
- **Allowed image types**: JPEG, JPG, PNG, GIF, WebP
- **Max image size**: 10MB
- **File type check**: Validates MIME type
- **Size check**: Validates file.size property

## Enhanced Error Logging

### Backend Logging Added:
```typescript
// Directory creation errors
console.error('Directory creation error:', {
  message: dirError?.message,
  code: dirError?.code,
  path: userDir
})

// File write errors
console.error('File write error:', {
  message: writeError?.message,
  code: writeError?.code,
  path: filepath,
  bufferSize: buffer.length
})

// General upload errors
console.error('File upload error:', {
  message: error?.message,
  code: error?.code,
  stack: error?.stack,
  name: error?.name
})
```

### Frontend Logging Added:
```typescript
// Successful upload
console.log('Image uploaded successfully:', { 
  fileName: file.name, 
  url: data.url 
})

// Failed upload
console.error('Image upload failed:', { 
  fileName: file.name, 
  status: response.status,
  error: errorData 
})

// Failed uploads batch
console.error('Failed uploads:', failedUploads)
```

## Debugging Steps

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages with details
4. Check Network tab for failed requests

### Step 2: Check Server Logs
1. Look at Next.js dev server output
2. Search for "File upload error" or "Directory creation error"
3. Note the error code and message

### Step 3: Verify Directory Structure
```bash
# Check if upload directory exists
ls -la public/uploads/images/

# Check permissions
stat public/uploads/images/
```

### Step 4: Test with Different File
- Try a smaller file (< 1MB)
- Try different format (PNG instead of JPEG)
- Try a different image

## Common Error Codes

| Error | Cause | Solution |
|-------|-------|----------|
| `EACCES` | Permission denied | Check directory permissions |
| `ENOENT` | File not found | Directory doesn't exist |
| `EISDIR` | Is a directory | Path is directory, not file |
| `EMFILE` | Too many open files | Restart server |
| `ENOSPC` | No space left | Free up disk space |

## File Upload API Endpoint

### Request
```bash
POST /api/upload
Content-Type: multipart/form-data

file: <binary file data>
type: "image" | "video" | "audio"
```

### Response (Success)
```json
{
  "success": true,
  "url": "/uploads/images/user-id/timestamp_hash_filename.jpg",
  "filename": "timestamp_hash_filename.jpg",
  "size": 102400,
  "type": "image/jpeg",
  "message": "File uploaded successfully"
}
```

### Response (Error)
```json
{
  "error": "Failed to save file",
  "message": "Please try again later",
  "details": "EACCES: permission denied, open '/path/to/file'"
}
```

## Upload Directory Structure

```
public/
├── uploads/
│   ├── images/
│   │   └── user-id/
│   │       ├── 1729667655000_abc123def456_download-1.jpeg
│   │       └── 1729667655001_xyz789abc123_images-1.jpeg
│   ├── videos/
│   │   └── user-id/
│   └── audio/
│       └── user-id/
```

## File Naming Convention

Format: `{timestamp}_{hash}_{original-name}`

Example: `1729667655000_abc123def456_download-1.jpeg`

- **Timestamp**: Current time in milliseconds
- **Hash**: First 16 chars of SHA256 hash of file content
- **Original Name**: Sanitized original filename

## Security Features

✅ **File Type Validation**: Only allowed MIME types
✅ **File Size Limits**: 10MB for images, 100MB for videos, 50MB for audio
✅ **Authentication**: Requires valid session
✅ **Filename Sanitization**: Removes special characters
✅ **Content Hash**: Prevents duplicate uploads
✅ **User Isolation**: Files stored in user-specific directories

## Performance Optimization

- **Parallel Uploads**: Multiple files uploaded concurrently
- **Buffer Streaming**: Files processed in memory
- **Hash Generation**: SHA256 for content verification
- **Directory Caching**: Directories created once per session

## Testing Upload

### Manual Test
1. Go to `/admin/products/new`
2. Click "Upload Images"
3. Select 1-2 small images (< 1MB)
4. Check browser console for logs
5. Verify images appear in preview

### Automated Test
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "file=@test-image.jpg" \
  -F "type=image" \
  -H "Cookie: mlmpk-session=your-session-cookie"
```

## Troubleshooting Checklist

- [ ] Directory `/public/uploads/images/` exists
- [ ] Directory has write permissions (755 or 777)
- [ ] Disk has free space (> 100MB)
- [ ] File is valid image (JPEG, PNG, GIF, WebP)
- [ ] File size < 10MB
- [ ] User is authenticated (valid session)
- [ ] Browser console shows no errors
- [ ] Server logs show no errors
- [ ] Network tab shows 200 response
- [ ] Image URL is correct and accessible

## If Still Having Issues

1. **Check server logs** for detailed error messages
2. **Verify directory permissions**: `chmod 755 public/uploads/images/`
3. **Restart dev server**: `npm run dev`
4. **Clear browser cache**: Ctrl+Shift+Delete
5. **Try different file**: Use a known-good image
6. **Check disk space**: `df -h`
7. **Check file system**: `fsck` or equivalent

---

**Last Updated**: October 23, 2025
**Version**: 1.0.0
**Status**: Enhanced logging and error handling implemented ✅
